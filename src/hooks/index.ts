import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type LeadInput, type LeadListParams } from '../services/api';
import type { FollowUp, Lead, LeadPriority } from '../types';

export const queryKeys = {
  leads: (params?: unknown) => ['leads', params ?? {}] as const,
  lead: (id: string) => ['lead', id] as const,
  profiles: ['profiles'] as const,
  activities: (leadId: string) => ['activities', leadId] as const,
  followUps: (params?: unknown) => ['follow-ups', params ?? {}] as const,
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
    activity: ['dashboard', 'activity'] as const,
    sources: ['dashboard', 'sources'] as const,
    pipeline: ['dashboard', 'pipeline'] as const,
  },
  ai: {
    status: ['ai', 'status'] as const,
    insights: ['ai', 'insights'] as const,
    leadInsight: (leadId: string) => ['ai', 'insight', leadId] as const,
    dailySummary: ['ai', 'daily-summary'] as const,
  },
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** Invalidations shared by every mutation that can change CRM metrics. */
function useInvalidateCrm() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['leads'] });
    void queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);
}

// ─── Profiles ───
export function useProfiles() {
  return useQuery({
    queryKey: queryKeys.profiles,
    queryFn: () => api.profiles.list(),
  });
}

// ─── Leads ───
export function useLeadsQuery(params: LeadListParams = {}) {
  return useQuery({
    queryKey: queryKeys.leads(params),
    queryFn: () => api.leads.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useLeadQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.lead(id ?? ''),
    queryFn: () => api.leads.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateLead() {
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: (input: LeadInput) => api.leads.create(input),
    onSuccess: () => {
      invalidate();
      toast.success('Lead created successfully');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to create lead')),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<LeadInput> }) => api.leads.update(id, input),
    onSuccess: (lead) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.lead(lead.id) });
      invalidate();
      toast.success('Lead updated successfully');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to update lead')),
  });
}

export function useDeleteLead() {
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: (id: string) => api.leads.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Lead deleted');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to delete lead')),
  });
}

/** Pipeline usage: optimistic status update with rollback on error. */
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lead['status'] }) => api.leads.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      const snapshots = queryClient.getQueriesData({ queryKey: ['leads'] });
      queryClient.setQueriesData<{ items: Lead[] }>({ queryKey: ['leads'] }, (previous) => {
        if (!previous) return previous;
        return { ...previous, items: previous.items.map((lead) => (lead.id === id ? { ...lead, status } : lead)) };
      });
      return { snapshots };
    },
    onError: (error, _variables, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
      toast.error(errorMessage(error, 'Failed to update status'));
    },
    onSettled: () => {
      invalidate();
    },
  });
}

// ─── Activities ───
export function useActivities(leadId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.activities(leadId ?? ''),
    queryFn: () => api.activities.list(leadId as string),
    enabled: Boolean(leadId),
  });
}

export function useCreateActivity(leadId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: (input: { type: 'call' | 'email' | 'meeting' | 'note'; title: string; description?: string; occurredAt?: string }) =>
      api.activities.create(leadId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activities(leadId) });
      invalidate();
      toast.success('Activity recorded');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to record activity')),
  });
}

// ─── Follow-ups ───
export function useFollowUpsQuery(
  params: { view?: 'all' | 'upcoming' | 'overdue' | 'completed'; assignedTo?: string; leadId?: string; page?: number; pageSize?: number } = {}
) {
  return useQuery({
    queryKey: queryKeys.followUps(params),
    queryFn: () => api.followUps.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateFollowUp() {
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: (input: {
      leadId: string;
      title: string;
      description?: string;
      type: FollowUp['type'];
      dueAt: string;
      priority: LeadPriority;
      assignedToId?: string;
    }) => api.followUps.create(input),
    onSuccess: () => {
      invalidate();
      toast.success('Follow-up created');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to create follow-up')),
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: (id: string) => api.followUps.complete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      invalidate();
      toast.success('Follow-up marked as complete');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to complete follow-up')),
  });
}

export function useDeleteFollowUp() {
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: (id: string) => api.followUps.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Follow-up deleted');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to delete follow-up')),
  });
}

// ─── Dashboard ───
export function useDashboardSummary() {
  return useQuery({ queryKey: queryKeys.dashboard.summary, queryFn: () => api.dashboard.summary() });
}

export function useDashboardActivity() {
  return useQuery({ queryKey: queryKeys.dashboard.activity, queryFn: () => api.dashboard.activity() });
}

export function useDashboardSources() {
  return useQuery({ queryKey: queryKeys.dashboard.sources, queryFn: () => api.dashboard.sources() });
}

export function useDashboardPipeline() {
  return useQuery({ queryKey: queryKeys.dashboard.pipeline, queryFn: () => api.dashboard.pipeline() });
}

// ─── AI ───
export function useAiStatus() {
  return useQuery({ queryKey: queryKeys.ai.status, queryFn: () => api.ai.status(), staleTime: 5 * 60_000 });
}

export function useAiInsights() {
  return useQuery({ queryKey: queryKeys.ai.insights, queryFn: () => api.ai.insights() });
}

export function useLeadInsight(leadId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ai.leadInsight(leadId ?? ''),
    queryFn: () => api.ai.leadInsight(leadId as string),
    enabled: Boolean(leadId),
  });
}

export function useGenerateInsight(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.ai.generateInsight(leadId),
    onSuccess: (insight) => {
      queryClient.setQueryData(queryKeys.ai.leadInsight(leadId), insight);
      void queryClient.invalidateQueries({ queryKey: queryKeys.ai.insights });
      toast.success(insight.provider === 'gemini' ? 'Gemini insight generated' : 'Demo insight generated (not Gemini)');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to generate insight')),
  });
}

export function useAiChat() {
  return useMutation({
    mutationFn: (question: string) => api.ai.chat(question),
  });
}

export function useAiSearch() {
  return useMutation({
    mutationFn: (query: string) => api.ai.search(query),
  });
}

export function useDailySummary() {
  return useQuery({
    queryKey: queryKeys.ai.dailySummary,
    queryFn: () => api.ai.dailySummary(),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useEmailDraft() {
  return useMutation({
    mutationFn: (leadId: string) => api.ai.emailDraft(leadId),
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, subject, body }: { leadId: string; subject: string; body: string }) =>
      api.ai.sendEmail(leadId, subject, body),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activities(variables.leadId) });
      toast.success('Email sent');
    },
    onError: (error) => toast.error(errorMessage(error, 'Email could not be sent')),
  });
}

// ─── Utilities ───
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Theme ───
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('signaldesk-theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('signaldesk-theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  return { isDark, toggle };
}

// ─── Mobile sidebar ───
export function useMobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen((p) => !p), []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, toggle, close };
}
