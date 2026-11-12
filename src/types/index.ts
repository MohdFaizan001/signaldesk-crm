// ─── SignalDesk Type Definitions ───

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'negotiation' | 'converted' | 'lost';
export type LeadPriority = 'low' | 'medium' | 'high' | 'critical';
export type LeadSource = 'website' | 'referral' | 'linkedin' | 'cold-call' | 'email-campaign' | 'trade-show' | 'partner';
export type FollowUpType = 'call' | 'email' | 'meeting' | 'demo' | 'proposal';
export type FollowUpStatus = 'upcoming' | 'overdue' | 'completed';
export type UserRole = 'admin' | 'sales-rep' | 'manager';

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
  type: 'call' | 'email' | 'meeting' | 'note' | 'status-change' | 'deal-update';
  title: string;
  description: string;
  createdAt: string;
  createdBy: string;
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
  completedAt?: string;
}

export interface AIInsight {
  leadId: string;
  leadName: string;
  score: number;
  conversionProbability: number;
  scoreExplanation: string;
  nextBestAction: string;
  followUpMessage: string;
  summary: string;
  riskFactors: string[];
  opportunities: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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
}

export interface ImportPreview {
  headers: string[];
  rows: string[][];
  mapping: Record<string, string>;
  validCount: number;
  errorCount: number;
  errors: { row: number; field: string; message: string }[];
}
