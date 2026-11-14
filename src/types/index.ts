// ─── SignalDesk Type Definitions ───

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'negotiation' | 'converted' | 'lost';
export type LeadPriority = 'low' | 'medium' | 'high';
export type LeadSource = 'website' | 'referral' | 'linkedin' | 'cold-call' | 'email-campaign' | 'trade-show' | 'partner';
export type FollowUpType = 'call' | 'email' | 'meeting' | 'demo' | 'proposal';
export type FollowUpStatus = 'upcoming' | 'overdue' | 'completed';
export type UserRole = 'admin' | 'sales_rep';
export type AiProvider = 'gemini' | 'mock';

export interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo: string;
  assignedToId: string;
  assignedToEmail?: string | null;
  createdById?: string;
  dealValue?: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  tags?: string[];
  website?: string;
  location?: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  title: string;
  description: string;
  occurredAt: string;
  createdAt: string;
  createdBy: string;
  createdById: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  type: FollowUpType;
  title: string;
  description: string;
  dueDate: string;
  status: FollowUpStatus;
  priority: LeadPriority;
  assignedTo: string;
  assignedToId: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIInsight {
  id: string;
  leadId: string;
  leadName: string;
  score: number;
  conversionProbability: number;
  summary: string;
  reasoning: string;
  scoreExplanation: string;
  nextBestAction: string;
  suggestedMessage: string;
  followUpMessage: string;
  riskFactors: string[];
  opportunities: string[];
  missingInformation: string[];
  model: string;
  provider: AiProvider;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalLeads: number;
  newLeads: number;
  convertedCustomers: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  conversionRate: number;
  totalDealValue: number;
  avgDealSize: number;
}

export interface PipelineStage {
  id: LeadStatus;
  label: string;
  color: string;
  leads: Lead[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: AiProvider;
}

export interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardSummary extends DashboardMetrics {
  recentActivities: Activity[];
  upcomingFollowUps: FollowUp[];
}

export interface PipelinePoint {
  status: LeadStatus;
  label: string;
  count: number;
  value: number;
}

export interface LeadSourcePoint {
  source: string;
  count: number;
  percentage: number;
}

export interface ActivityPoint {
  month: string;
  leads: number;
  revenue: number;
}

export interface AiStatus {
  configured: boolean;
  model: string;
  mode: 'gemini' | 'mock';
  message: string;
}

export interface DailySummary {
  summary: string;
  generatedAt: string;
  provider: AiProvider;
  model: string;
  metrics: {
    newLeads: number;
    convertedLeads: number;
    lostLeads: number;
    pendingFollowUps: number;
    overdueFollowUps: number;
    pipelineValue: number;
  };
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  provider: AiProvider;
  model: string;
}

export interface ImportPreview {
  headers: string[];
  rows: string[][];
  mapping: Record<string, string>;
  validCount: number;
  errorCount: number;
  errors: { row: number; field: string; message: string }[];
}
