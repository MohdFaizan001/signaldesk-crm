import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthContext } from '../../types/express.js';
import { normalizeEmail } from '../leads/leads.service.js';
import type { Lead } from '../leads/leads.types.js';
import { importLeadRowSchema } from '../leads/leads.schemas.js';
import { LEAD_SELECT, mapLead, type LeadRow } from '../leads/leads.types.js';

export interface ImportRowError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  leads: Lead[];
  errors: ImportRowError[];
}

export async function importLeads(
  supabase: SupabaseClient,
  rows: unknown[],
  auth: AuthContext
): Promise<ImportResult> {
  const errors: ImportRowError[] = [];
  const seen = new Set<string>();
  const candidates: { row: number; data: ReturnType<typeof importLeadRowSchema.parse> }[] = [];
  let failed = 0;
  let skipped = 0;

  rows.forEach((raw, index) => {
    const parsed = importLeadRowSchema.safeParse(raw);
    if (!parsed.success) {
      failed += 1;
      errors.push({
        row: index + 1,
        field: parsed.error.issues[0]?.path.join('.') || 'row',
        message: parsed.error.issues[0]?.message || 'Invalid row',
      });
      return;
    }
    const normalized = normalizeEmail(parsed.data.email);
    if (seen.has(normalized)) {
      skipped += 1;
      errors.push({ row: index + 1, field: 'email', message: 'Duplicate email inside CSV' });
      return;
    }
    seen.add(normalized);
    candidates.push({ row: index + 1, data: parsed.data });
  });

  // Detect rows that already exist in the database (normalized email).
  const emails = candidates.map((candidate) => normalizeEmail(candidate.data.email));
  const existing = new Set<string>();
  if (emails.length > 0) {
    const { data, error } = await supabase
      .from('leads')
      .select('normalized_email')
      .in('normalized_email', emails);
    if (error) throw new Error('Failed to check existing leads');
    for (const row of (data ?? []) as { normalized_email: string }[]) existing.add(row.normalized_email);
  }

  const imported: Lead[] = [];
  for (const candidate of candidates) {
    if (existing.has(normalizeEmail(candidate.data.email))) {
      skipped += 1;
      errors.push({ row: candidate.row, field: 'email', message: 'Lead with this email already exists' });
      continue;
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        full_name: candidate.data.fullName,
        email: candidate.data.email,
        phone: candidate.data.phone || null,
        company: candidate.data.company,
        job_title: candidate.data.jobTitle || null,
        source: candidate.data.source,
        status: candidate.data.status,
        priority: candidate.data.priority,
        notes: candidate.data.notes ?? null,
        deal_value: candidate.data.dealValue ?? null,
        created_by: auth.user.id,
        assigned_to: auth.user.id,
      })
      .select(LEAD_SELECT)
      .single();

    if (error) {
      failed += 1;
      errors.push({ row: candidate.row, field: 'row', message: 'Database rejected this row' });
      continue;
    }
    imported.push(mapLead(data as unknown as LeadRow));
  }

  return { imported: imported.length, skipped, failed, leads: imported, errors };
}
