import { describe, expect, it } from 'vitest';
import type { Lead } from '../modules/leads/leads.types.js';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key-12345678901234567890';
delete process.env.GEMINI_API_KEY;

const { buildMockInsight, heuristicFilters } = await import('../modules/ai/ai.service.js');

const lead: Lead = {
  id: '00000000-0000-4000-8000-000000000001',
  fullName: 'Jane Cooper',
  email: 'jane@acme.test',
  phone: '',
  company: 'Acme',
  jobTitle: '',
  source: 'linkedin',
  status: 'negotiation',
  priority: 'high',
  notes: null,
  dealValue: null,
  location: null,
  website: null,
  tags: [],
  createdById: '00000000-0000-4000-8000-000000000002',
  assignedToId: '00000000-0000-4000-8000-000000000002',
  assignedTo: 'Sam Rep',
  assignedToEmail: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('heuristicFilters', () => {
  it('extracts priority, source and recency without SQL', () => {
    const filters = heuristicFilters('Show me high priority LinkedIn leads from the last 30 days');
    expect(filters).toMatchObject({
      priority: 'high',
      source: 'linkedin',
      createdWithinDays: 30,
      limit: 20,
      sortBy: 'created_at',
      sortDir: 'desc',
    });
  });

  it('maps negotiation and ownership phrases', () => {
    const filters = heuristicFilters('my negotiating deals assigned to me');
    expect(filters.status).toBe('negotiation');
    expect(filters.assignedToMe).toBe(true);
  });

  it('understands relative date phrases', () => {
    expect(heuristicFilters('new leads today').createdWithinDays).toBe(1);
    expect(heuristicFilters('leads this week').createdWithinDays).toBe(7);
    expect(heuristicFilters('leads this month').createdWithinDays).toBe(30);
  });
});

describe('buildMockInsight', () => {
  it('is clearly rule-based and keeps scores in range', () => {
    const insight = buildMockInsight(lead, 2, 1, 1);
    expect(insight.score).toBeGreaterThan(0);
    expect(insight.score).toBeLessThanOrEqual(100);
    expect(insight.conversionProbability).toBeGreaterThanOrEqual(2);
    expect(insight.conversionProbability).toBeLessThanOrEqual(95);
    expect(insight.reasoning).toContain('rule-based demo estimate');
    expect(insight.positiveSignals.length).toBeGreaterThan(0);
    expect(insight.riskFactors.join(' ')).toContain('overdue');
    expect(insight.riskFactors.join(' ')).toContain('No deal value');
  });

  it('flags missing information instead of inventing it', () => {
    const insight = buildMockInsight(lead, 0, 0, 0);
    expect(insight.missingInformation).toEqual(
      expect.arrayContaining(['Job title', 'Expected deal value', 'Discovery notes', 'Interaction history'])
    );
    expect(insight.riskFactors.join(' ')).toContain('No customer interactions');
  });

  it('never claims the CRM was updated', () => {
    const insight = buildMockInsight(lead, 1, 0, 0);
    const text = `${insight.summary} ${insight.reasoning} ${insight.nextBestAction} ${insight.suggestedMessage}`.toLowerCase();
    expect(text).not.toContain('updated the crm');
  });
});
