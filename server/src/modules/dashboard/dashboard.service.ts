import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../utils/ApiError.js';
import { LEAD_STATUSES, type LeadStatus } from '../../domain/constants.js';
import { listRecentActivities, type Activity } from '../activities/activities.service.js';
import { FOLLOW_UP_SELECT, mapFollowUp, type FollowUp } from '../followups/followups.service.js';

export interface DashboardSummary {
  totalLeads: number;
  newLeads: number;
  convertedCustomers: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  /** converted / totalLeads × 100, rounded to one decimal. 0 when there are no leads. */
  conversionRate: number;
  totalDealValue: number;
  avgDealSize: number;
  recentActivities: Activity[];
  upcomingFollowUps: FollowUp[];
}

interface LeadMetricRow {
  status: string;
  source: string;
  deal_value: number | string | null;
  created_at: string;
  updated_at: string;
}

interface FollowUpMetricRow {
  id: string;
  due_at: string;
  completed_at: string | null;
  [key: string]: unknown;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  negotiation: 'Negotiation',
  converted: 'Converted',
  lost: 'Lost',
};

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateConversionRate(converted: number, total: number): number {
  if (total <= 0) return 0;
  return round((converted / total) * 100, 1);
}

async function fetchLeadMetrics(supabase: SupabaseClient): Promise<LeadMetricRow[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('status, source, deal_value, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) throw new ApiError(500, 'Failed to load dashboard metrics');
  return (data ?? []) as LeadMetricRow[];
}

async function fetchOpenFollowUps(supabase: SupabaseClient): Promise<FollowUpMetricRow[]> {
  const { data, error } = await supabase
    .from('follow_ups')
    .select('id, due_at, completed_at')
    .order('due_at', { ascending: true })
    .limit(2000);
  if (error) throw new ApiError(500, 'Failed to load follow-up metrics');
  return (data ?? []) as unknown as FollowUpMetricRow[];
}

export async function getSummary(
  supabase: SupabaseClient,
  _profile: { role: string; id: string }
): Promise<DashboardSummary> {
  const [leads, followUps, recentActivities] = await Promise.all([
    fetchLeadMetrics(supabase),
    fetchOpenFollowUps(supabase),
    listRecentActivities(supabase, 6),
  ]);

  const now = Date.now();
  const converted = leads.filter((lead) => lead.status === 'converted').length;
  const openFollowUps = followUps.filter((followUp) => !followUp.completed_at);
  const overdue = openFollowUps.filter((followUp) => new Date(followUp.due_at).getTime() < now).length;
  const pending = openFollowUps.length - overdue;

  const totalDealValue = leads.reduce((sum, lead) => sum + Number(lead.deal_value ?? 0), 0);
  const leadsWithValue = leads.filter((lead) => Number(lead.deal_value ?? 0) > 0).length;

  // Upcoming widget: nearest open follow-ups (overdue first by date).
  const { data: followUpRows } = await supabase
    .from('follow_ups')
    .select(FOLLOW_UP_SELECT)
    .is('completed_at', null)
    .order('due_at', { ascending: true })
    .limit(8);

  const upcomingFollowUps = ((followUpRows ?? []) as never[]).map((row) => mapFollowUp(row));

  return {
    totalLeads: leads.length,
    newLeads: leads.filter((lead) => lead.status === 'new').length,
    convertedCustomers: converted,
    pendingFollowUps: pending,
    overdueFollowUps: overdue,
    conversionRate: calculateConversionRate(converted, leads.length),
    totalDealValue: round(totalDealValue, 2),
    avgDealSize: leadsWithValue > 0 ? round(totalDealValue / leadsWithValue, 2) : 0,
    recentActivities,
    upcomingFollowUps,
  };
}

export interface MonthlyActivityPoint {
  month: string;
  leads: number;
  revenue: number;
}

export function buildMonthlyActivity(leads: LeadMetricRow[], reference = new Date()): MonthlyActivityPoint[] {
  const points: MonthlyActivityPoint[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(reference.getFullYear(), reference.getMonth() - offset, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'short' });
    let count = 0;
    let revenue = 0;
    for (const lead of leads) {
      const created = new Date(lead.created_at);
      if (`${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}` === monthKey) {
        count += 1;
      }
      const updated = new Date(lead.updated_at);
      if (
        lead.status === 'converted' &&
        `${updated.getFullYear()}-${String(updated.getMonth() + 1).padStart(2, '0')}` === monthKey
      ) {
        revenue += Number(lead.deal_value ?? 0);
      }
    }
    points.push({ month: label, leads: count, revenue: Math.round(revenue) });
  }
  return points;
}

export async function getMonthlyActivity(supabase: SupabaseClient) {
  const leads = await fetchLeadMetrics(supabase);
  return buildMonthlyActivity(leads);
}

export async function getLeadSources(supabase: SupabaseClient) {
  const leads = await fetchLeadMetrics(supabase);
  const counts = new Map<string, number>();
  for (const lead of leads) counts.set(lead.source, (counts.get(lead.source) ?? 0) + 1);
  const total = leads.length || 1;
  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count, percentage: round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export async function getPipeline(supabase: SupabaseClient) {
  const leads = await fetchLeadMetrics(supabase);
  return LEAD_STATUSES.map((status) => {
    const matching = leads.filter((lead) => lead.status === status);
    return {
      status,
      label: STATUS_LABELS[status],
      count: matching.length,
      value: round(matching.reduce((sum, lead) => sum + Number(lead.deal_value ?? 0), 0), 2),
    };
  });
}
