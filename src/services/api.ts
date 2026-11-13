import { supabase, requireSupabase } from '../lib/supabase';
import type {
  AIInsight,
  Activity,
  AiStatus,
  ActivityPoint,
  ChatMessage,
  DailySummary,
  DashboardSummary,
  EmailDraft,
  FollowUp,
  Lead,
  LeadPriority,
  LeadSource,
  LeadStatus,
  LeadSourcePoint,
  Paginated,
  PipelinePoint,
  Profile,
  UserRole,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details: unknown[];

  constructor(status: number, message: string, code?: string, details: unknown[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function authHeader(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await authHeader();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Cannot reach the SignalDesk API. Is the backend running?');
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let code: string | undefined;
    let details: unknown[] = [];
    try {
      const body = await response.json();
      message = body.message || message;
      code = body.code;
      details = Array.isArray(body.errors) ? body.errors : [];
    } catch {
      // non-JSON error body
    }
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event('signaldesk:unauthorized'));
    }
    throw new ApiError(response.status, message, code, details);
  }

  const body = (await response.json()) as { success: boolean; data: T; message: string };
  return body.data;
}

function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
}

export interface LeadListParams {
  search?: string;
  status?: LeadStatus | '';
  priority?: LeadPriority | '';
  source?: LeadSource | '';
  assignedTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'full_name' | 'created_at' | 'updated_at' | 'deal_value' | 'priority' | 'status';
  sortDir?: 'asc' | 'desc';
}

export interface LeadInput {
  fullName: string;
  email: string;
  phone?: string;
  company: string;
  jobTitle?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assignedToId?: string;
  dealValue?: number;
  notes?: string;
  location?: string;
  website?: string;
}

interface AiInsightDto extends Omit<AIInsight, 'scoreExplanation' | 'followUpMessage' | 'opportunities'> {
  reasoning: string;
  positiveSignals: string[];
  suggestedMessage: string;
}

function mapInsight(dto: AiInsightDto): AIInsight {
  return {
    ...dto,
    scoreExplanation: dto.reasoning,
    followUpMessage: dto.suggestedMessage,
    opportunities: dto.positiveSignals,
  };
}

export interface AiSearchResult {
  filters: Record<string, unknown>;
  items: Lead[];
  pagination: Paginated<Lead>['pagination'];
  provider: 'gemini' | 'mock';
  model: string;
}

export const api = {
  profiles: {
    me: () => request<Profile>('/me'),
    list: () => request<Profile[]>('/profiles'),
    updateMe: (input: { fullName?: string; avatarUrl?: string | null }) =>
      request<Profile>('/profiles/me', { method: 'PATCH', body: JSON.stringify(input) }),
    updateRole: (id: string, role: UserRole) =>
      request<Profile>(`/profiles/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  },

  leads: {
    list: (params: LeadListParams = {}) =>
      request<Paginated<Lead>>(`/leads${queryString({ ...params })}`),
    get: (id: string) => request<Lead>(`/leads/${id}`),
    create: (input: LeadInput) => request<Lead>('/leads', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Partial<LeadInput>) =>
      request<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    remove: (id: string) => request<null>(`/leads/${id}`, { method: 'DELETE' }),
    importRows: (leads: LeadInput[]) =>
      request<{ imported: number; skipped: number; failed: number; leads: Lead[]; errors: { row: number; field: string; message: string }[] }>(
        '/leads/import',
        { method: 'POST', body: JSON.stringify({ leads }) }
      ),
    exportCsv: async (params: Omit<LeadListParams, 'page' | 'pageSize' | 'sortBy' | 'sortDir'> = {}) => {
      const token = await authHeader();
      const response = await fetch(`${API_BASE}/leads/export${queryString({ ...params })}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new ApiError(response.status, 'Export failed. Please try again.');
      }
      return response.text();
    },
  },

  activities: {
    list: (leadId: string) => request<Activity[]>(`/leads/${leadId}/activities`),
    create: (leadId: string, input: { type: Activity['type']; title: string; description?: string; occurredAt?: string }) =>
      request<Activity>(`/leads/${leadId}/activities`, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Partial<Pick<Activity, 'type' | 'title' | 'description'>>) =>
      request<Activity>(`/activities/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    remove: (id: string) => request<null>(`/activities/${id}`, { method: 'DELETE' }),
  },

  followUps: {
    list: (params: { view?: 'all' | 'upcoming' | 'overdue' | 'completed'; assignedTo?: string; leadId?: string; page?: number; pageSize?: number } = {}) =>
      request<Paginated<FollowUp>>(`/follow-ups${queryString({ ...params })}`),
    get: (id: string) => request<FollowUp>(`/follow-ups/${id}`),
    create: (input: {
      leadId: string;
      title: string;
      description?: string;
      type: FollowUp['type'];
      dueAt: string;
      priority: LeadPriority;
      assignedToId?: string;
    }) => request<FollowUp>('/follow-ups', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Partial<{ title: string; description: string; type: FollowUp['type']; dueAt: string; priority: LeadPriority; assignedToId: string }>) =>
      request<FollowUp>(`/follow-ups/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    complete: (id: string) => request<FollowUp>(`/follow-ups/${id}/complete`, { method: 'PATCH' }),
    remove: (id: string) => request<null>(`/follow-ups/${id}`, { method: 'DELETE' }),
  },

  dashboard: {
    summary: () => request<DashboardSummary>('/dashboard/summary'),
    activity: () => request<ActivityPoint[]>('/dashboard/activity'),
    sources: () => request<LeadSourcePoint[]>('/dashboard/lead-sources'),
    pipeline: () => request<PipelinePoint[]>('/dashboard/pipeline'),
  },

  ai: {
    status: () => request<AiStatus>('/ai/status'),
    insights: () => request<AiInsightDto[]>('/ai/insights').then((rows) => rows.map(mapInsight)),
    leadInsight: (leadId: string) =>
      request<AiInsightDto | null>(`/ai/leads/${leadId}/insight`).then((row) => (row ? mapInsight(row) : null)),
    generateInsight: (leadId: string) =>
      request<AiInsightDto>(`/ai/leads/${leadId}/insight`, { method: 'POST' }).then(mapInsight),
    chat: (question: string) =>
      request<{ answer: string; provider: 'gemini' | 'mock'; model: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ question }),
      }),
    search: (query: string) =>
      request<AiSearchResult>('/ai/search', { method: 'POST', body: JSON.stringify({ query }) }),
    dailySummary: () => request<DailySummary>('/ai/daily-summary'),
    emailDraft: (leadId: string) => request<EmailDraft>(`/ai/leads/${leadId}/email-draft`, { method: 'POST' }),
    sendEmail: (leadId: string, subject: string, body: string) =>
      request<{ sent: boolean; messageId: string | null; activityId: string | null }>(`/ai/leads/${leadId}/send-email`, {
        method: 'POST',
        body: JSON.stringify({ subject, body }),
      }),
  },
};

export function chatMessage(role: ChatMessage['role'], content: string, provider?: ChatMessage['provider']): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    provider,
  };
}

export { requireSupabase, API_BASE };
