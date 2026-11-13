import { describe, expect, it } from 'vitest';
import { createLeadSchema, importLeadRowSchema } from '../modules/leads/leads.schemas.js';
import { createFollowUpSchema } from '../modules/followups/followups.schemas.js';
import { aiLeadFiltersSchema, aiInsightSchema, sendEmailSchema } from '../modules/ai/ai.schemas.js';
import { updateProfileSchema } from '../modules/profiles/profiles.service.js';

const validLead = {
  fullName: 'Jane Cooper',
  email: 'jane@acme.test',
  company: 'Acme',
};

describe('lead schemas', () => {
  it('applies safe defaults for optional fields', () => {
    const parsed = createLeadSchema.parse(validLead);
    expect(parsed.status).toBe('new');
    expect(parsed.priority).toBe('medium');
    expect(parsed.source).toBe('website');
    expect(parsed.phone).toBe('');
  });

  it('rejects invalid emails and removed priorities', () => {
    expect(createLeadSchema.safeParse({ ...validLead, email: 'not-an-email' }).success).toBe(false);
    expect(createLeadSchema.safeParse({ ...validLead, priority: 'critical' }).success).toBe(false);
    expect(createLeadSchema.safeParse({ ...validLead, fullName: 'J' }).success).toBe(false);
  });

  it('validates import rows individually and strips unknown fields', () => {
    const parsed = importLeadRowSchema.parse({ ...validLead, location: 'ignored', tags: ['ignored'] });
    expect(parsed).not.toHaveProperty('location');
    expect(parsed).not.toHaveProperty('tags');
    expect(importLeadRowSchema.safeParse({ ...validLead, email: 'bad' }).success).toBe(false);
  });
});

describe('follow-up schemas', () => {
  it('requires an ISO due date and a known priority', () => {
    const base = {
      leadId: '11111111-1111-4111-8111-111111111111',
      title: 'Call back',
      dueAt: new Date().toISOString(),
      priority: 'high',
    };
    expect(createFollowUpSchema.safeParse(base).success).toBe(true);
    expect(createFollowUpSchema.safeParse({ ...base, dueAt: 'tomorrow' }).success).toBe(false);
    expect(createFollowUpSchema.safeParse({ ...base, priority: 'critical' }).success).toBe(false);
  });
});

describe('AI schemas', () => {
  it('accepts allowlisted filters and drops unknown keys such as sql', () => {
    const parsed = aiLeadFiltersSchema.parse({
      priority: 'high',
      source: 'linkedin',
      createdWithinDays: 30,
      sql: 'DROP TABLE leads',
    });
    expect(parsed).toEqual({ priority: 'high', source: 'linkedin', createdWithinDays: 30 });
    expect(parsed).not.toHaveProperty('sql');
  });

  it('rejects out-of-range insight scores', () => {
    const validInsight = {
      summary: 'A sufficiently long summary.',
      score: 80,
      conversionProbability: 60,
      reasoning: 'A sufficiently long reasoning string.',
      positiveSignals: ['Good momentum'],
      riskFactors: [],
      missingInformation: [],
      nextBestAction: 'Schedule a call',
      suggestedMessage: 'Hi Jane, following up on our conversation.',
    };
    expect(aiInsightSchema.safeParse(validInsight).success).toBe(true);
    expect(aiInsightSchema.safeParse({ ...validInsight, score: 101 }).success).toBe(false);
  });

  it('validates email send bodies', () => {
    expect(sendEmailSchema.safeParse({ subject: 'Hi', body: 'short' }).success).toBe(false);
    expect(sendEmailSchema.safeParse({ subject: 'Hello', body: 'A valid email body.' }).success).toBe(true);
  });
});

describe('profile schemas', () => {
  it('requires at least one updatable field', () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
    expect(updateProfileSchema.safeParse({ fullName: 'Jane Cooper' }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ avatarUrl: 'not-a-url' }).success).toBe(false);
  });
});
