// ─── Mock Service Layer ───
// All data operations are isolated here. Replace with real API calls in Phase B.

import { mockLeads, mockFollowUps, mockActivities, mockAIInsights } from '../data/mockData';
import type { Lead, FollowUp, Activity, AIInsight, LeadStatus } from '../types';
import { generateId } from '../utils';

// In-memory store (simulates backend state)
let leads = [...mockLeads];
let followUps = [...mockFollowUps];
let activities = [...mockActivities];

// Simulate network delay
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Lead Operations ───

export async function getLeads(): Promise<Lead[]> {
  await delay(200);
  return [...leads];
}

export async function getLeadById(id: string): Promise<Lead | undefined> {
  await delay(150);
  return leads.find((l) => l.id === id);
}

export async function createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
  await delay(300);
  const newLead: Lead = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  leads = [newLead, ...leads];
  return newLead;
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  await delay(300);
  leads = leads.map((l) =>
    l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l
  );
  const updated = leads.find((l) => l.id === id);
  if (!updated) throw new Error('Lead not found');
  return updated;
}

export async function deleteLead(id: string): Promise<void> {
  await delay(300);
  leads = leads.filter((l) => l.id !== id);
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  return updateLead(id, { status });
}

// ─── Follow-Up Operations ───

export async function getFollowUps(): Promise<FollowUp[]> {
  await delay(200);
  return [...followUps];
}

export async function createFollowUp(data: Omit<FollowUp, 'id'>): Promise<FollowUp> {
  await delay(300);
  const newFollowUp: FollowUp = {
    ...data,
    id: generateId(),
  };
  followUps = [newFollowUp, ...followUps];
  return newFollowUp;
}

export async function completeFollowUp(id: string): Promise<FollowUp> {
  await delay(300);
  followUps = followUps.map((f) =>
    f.id === id ? { ...f, status: 'completed' as const, completedAt: new Date().toISOString() } : f
  );
  const updated = followUps.find((f) => f.id === id);
  if (!updated) throw new Error('Follow-up not found');
  return updated;
}

// ─── Activity Operations ───

export async function getActivitiesByLead(leadId: string): Promise<Activity[]> {
  await delay(200);
  return activities.filter((a) => a.leadId === leadId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createActivity(data: Omit<Activity, 'id'>): Promise<Activity> {
  await delay(300);
  const newActivity: Activity = {
    ...data,
    id: generateId(),
  };
  activities.unshift(newActivity);
  return newActivity;
}

export async function getAllActivities(): Promise<Activity[]> {
  await delay(200);
  return [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ─── AI Operations ───

export async function getAIInsight(leadId: string): Promise<AIInsight | undefined> {
  await delay(500); // Simulate AI processing time
  return mockAIInsights.find((i) => i.leadId === leadId);
}

export async function getAllAIInsights(): Promise<AIInsight[]> {
  await delay(400);
  return [...mockAIInsights];
}

export async function askAI(question: string): Promise<string> {
  await delay(800); // Simulate AI response time
  // Check for matching sample responses
  const matchingKey = Object.keys(await import('../data/mockData').then(m => m.sampleAIResponses)).find(
    (key) => question.toLowerCase().includes(key.toLowerCase().slice(0, 20))
  );
  if (matchingKey) {
    const { sampleAIResponses } = await import('../data/mockData');
    return sampleAIResponses[matchingKey];
  }
  return `Based on your current pipeline data, here's what I found:\n\nYour CRM has 15 active leads with a total pipeline value of $707,000. The conversion rate stands at 13.3% with 2 deals successfully closed this quarter.\n\n*This is a sample response. AI integration will be available in the next release.*`;
}

// ─── Dashboard ───

export async function getDashboardMetrics() {
  await delay(200);
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const convertedCustomers = leads.filter((l) => l.status === 'converted').length;
  const allFollowUps = followUps;
  const pendingFollowUps = allFollowUps.filter((f) => f.status === 'upcoming').length;
  const overdueFollowUps = allFollowUps.filter((f) => f.status === 'overdue').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedCustomers / totalLeads) * 1000) / 10 : 0;
  const totalDealValue = leads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
  const leadsWithDeals = leads.filter((l) => l.dealValue && l.dealValue > 0);
  const avgDealSize = leadsWithDeals.length > 0 ? Math.round(totalDealValue / leadsWithDeals.length) : 0;
  return { totalLeads, newLeads, convertedCustomers, pendingFollowUps, overdueFollowUps, conversionRate, totalDealValue, avgDealSize };
}

export function getLeadStatusDistribution() {
  const statusLabels: Record<string, { label: string; color: string }> = {
    new: { label: 'New', color: '#4263D8' },
    contacted: { label: 'Contacted', color: '#D97706' },
    interested: { label: 'Interested', color: '#059669' },
    negotiation: { label: 'Negotiation', color: '#7C3AED' },
    converted: { label: 'Converted', color: '#16A34A' },
    lost: { label: 'Lost', color: '#DC2626' },
  };
  const counts: Record<string, number> = {};
  for (const l of leads) {
    counts[l.status] = (counts[l.status] || 0) + 1;
  }
  return Object.entries(statusLabels).map(([key, val]) => ({
    status: val.label,
    count: counts[key] || 0,
    color: val.color,
  }));
}

export function getLeadSourceDistribution() {
  const sourceLabels: Record<string, string> = {
    website: 'Website', referral: 'Referral', linkedin: 'LinkedIn',
    'cold-call': 'Cold Call', 'email-campaign': 'Email Campaign',
    'trade-show': 'Trade Show', partner: 'Partner',
  };
  const counts: Record<string, number> = {};
  for (const l of leads) {
    counts[l.source] = (counts[l.source] || 0) + 1;
  }
  const total = leads.length || 1;
  return Object.entries(sourceLabels)
    .map(([key, label]) => ({
      source: label,
      count: counts[key] || 0,
      percentage: Math.round(((counts[key] || 0) / total) * 1000) / 10,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);
}

// ─── CSV Import/Export ───

const REQUIRED_HEADERS = ['Name', 'Email', 'Company'];
const VALID_SOURCES = ['website', 'referral', 'linkedin', 'cold-call', 'email-campaign', 'trade-show', 'partner'];
const VALID_STATUSES = ['new', 'contacted', 'interested', 'negotiation', 'converted', 'lost'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

export async function parseCSV(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  await delay(500);
  const text = await file.text();
  const lines = text.split('\n').filter(Boolean);
  const headers = lines[0]?.split(',').map((h) => h.trim()) ?? [];
  const rows = lines.slice(1).map((line) => line.split(',').map((cell) => cell.trim()));
  return { headers, rows };
}

export interface ImportValidationResult {
  validRows: { index: number; data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> }[];
  errors: { row: number; field: string; message: string }[];
  headerErrors: string[];
}

export function validateCSVForImport(
  headers: string[],
  rows: string[][],
  columnMapping: Record<string, string>
): ImportValidationResult {
  const headerErrors: string[] = [];
  const mappedHeaders = headers.map((h) => columnMapping[h] || '');

  for (const req of REQUIRED_HEADERS) {
    const fieldName = columnMapping[req];
    if (!fieldName || !mappedHeaders.includes(fieldName)) {
      headerErrors.push(`Missing required column: ${req}`);
    }
  }

  if (headerErrors.length > 0) {
    return { validRows: [], errors: [], headerErrors };
  }

  const validRows: ImportValidationResult['validRows'] = [];
  const errors: ImportValidationResult['errors'] = [];

  const getCol = (field: string) => mappedHeaders.indexOf(field);

  rows.forEach((row, i) => {
    const rowNum = i + 2; // 1-indexed + header
    const fullName = row[getCol('fullName')]?.trim() || '';
    const email = row[getCol('email')]?.trim() || '';
    const company = row[getCol('company')]?.trim() || '';
    const phone = row[getCol('phone')]?.trim() || '';
    const sourceRaw = row[getCol('source')]?.trim().toLowerCase() || '';
    const statusRaw = row[getCol('status')]?.trim().toLowerCase() || '';
    const priorityRaw = row[getCol('priority')]?.trim().toLowerCase() || '';

    const rowErrors: typeof errors = [];

    if (!fullName) rowErrors.push({ row: rowNum, field: 'Name', message: 'Name is required' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      rowErrors.push({ row: rowNum, field: 'Email', message: email ? 'Invalid email format' : 'Email is required' });
    if (!company) rowErrors.push({ row: rowNum, field: 'Company', message: 'Company is required' });
    if (sourceRaw && !VALID_SOURCES.includes(sourceRaw))
      rowErrors.push({ row: rowNum, field: 'Source', message: `Invalid source: ${sourceRaw}` });
    if (statusRaw && !VALID_STATUSES.includes(statusRaw))
      rowErrors.push({ row: rowNum, field: 'Status', message: `Invalid status: ${statusRaw}` });
    if (priorityRaw && !VALID_PRIORITIES.includes(priorityRaw))
      rowErrors.push({ row: rowNum, field: 'Priority', message: `Invalid priority: ${priorityRaw}` });

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      validRows.push({
        index: i,
        data: {
          fullName,
          email,
          phone: phone || '',
          company,
          jobTitle: '',
          source: (VALID_SOURCES.includes(sourceRaw) ? sourceRaw : 'website') as Lead['source'],
          status: (VALID_STATUSES.includes(statusRaw) ? statusRaw : 'new') as Lead['status'],
          priority: (VALID_PRIORITIES.includes(priorityRaw) ? priorityRaw : 'medium') as Lead['priority'],
          assignedTo: 'Sarah Mitchell',
          assignedToId: 'u1',
        },
      });
    }
  });

  return { validRows, errors, headerErrors };
}

export async function importLeadsFromCSV(
  validRows: ImportValidationResult['validRows']
): Promise<Lead[]> {
  await delay(500);
  const created: Lead[] = [];
  for (const row of validRows) {
    const newLead: Lead = {
      ...row.data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    leads = [newLead, ...leads];
    created.push(newLead);
  }
  return created;
}

export async function exportLeadsCSV(): Promise<string> {
  await delay(300);
  const headers = ['Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Priority', 'Assigned To', 'Deal Value', 'Created'];
  const rows = leads.map((l) => [
    l.fullName, l.email, l.phone, l.company, l.source, l.status, l.priority, l.assignedTo,
    l.dealValue?.toString() ?? '', l.createdAt,
  ]);
  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}
