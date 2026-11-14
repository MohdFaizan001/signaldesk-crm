import type { LeadPriority, LeadSource, LeadStatus } from '../../domain/constants.js';

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
  notes: string | null;
  dealValue: number | null;
  location: string | null;
  website: string | null;
  tags: string[];
  createdById: string;
  assignedToId: string;
  assignedTo: string;
  assignedToEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string;
  job_title: string | null;
  source: string;
  status: string;
  priority: string;
  notes: string | null;
  deal_value: number | string | null;
  location: string | null;
  website: string | null;
  tags: string[] | null;
  created_by: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  assigned?: { id: string; full_name: string; email: string } | null;
}

export function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? '',
    company: row.company,
    jobTitle: row.job_title ?? '',
    source: row.source as LeadSource,
    status: row.status as LeadStatus,
    priority: row.priority as LeadPriority,
    notes: row.notes,
    dealValue: row.deal_value === null || row.deal_value === undefined ? null : Number(row.deal_value),
    location: row.location,
    website: row.website,
    tags: row.tags ?? [],
    createdById: row.created_by,
    assignedToId: row.assigned_to,
    assignedTo: row.assigned?.full_name ?? 'Unassigned',
    assignedToEmail: row.assigned?.email ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const LEAD_SELECT =
  'id, full_name, email, phone, company, job_title, source, status, priority, notes, deal_value, location, website, tags, created_by, assigned_to, created_at, updated_at, assigned:profiles!leads_assigned_to_fkey(id, full_name, email)';
