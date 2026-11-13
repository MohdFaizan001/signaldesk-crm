import { describe, expect, it } from 'vitest';
import { leadsToCsv, normalizeEmail } from '../modules/leads/leads.service.js';
import type { Lead } from '../modules/leads/leads.types.js';

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    fullName: 'Jane Cooper',
    email: 'jane@acme.test',
    phone: '+1 555 0100',
    company: 'Acme',
    jobTitle: 'VP Sales',
    source: 'website',
    status: 'new',
    priority: 'medium',
    notes: null,
    dealValue: 1000,
    location: null,
    website: null,
    tags: [],
    createdById: '00000000-0000-4000-8000-000000000002',
    assignedToId: '00000000-0000-4000-8000-000000000002',
    assignedTo: 'Sam Rep',
    assignedToEmail: 'sam@acme.test',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('normalizeEmail', () => {
  it('trims and lowercases addresses for duplicate detection', () => {
    expect(normalizeEmail('  Jane.Cooper@ACME.test ')).toBe('jane.cooper@acme.test');
  });
});

describe('leadsToCsv', () => {
  it('writes headers and one row per lead', () => {
    const csv = leadsToCsv([makeLead()]);
    const [header, row] = csv.split('\n');
    expect(header).toContain('Name,Email,Phone,Company');
    expect(row).toContain('Jane Cooper,jane@acme.test');
    expect(row).toContain('1000');
  });

  it('escapes commas, quotes and newlines', () => {
    const csv = leadsToCsv([
      makeLead({
        fullName: 'Cooper, Jane',
        company: 'Acme "Global"',
        notes: 'line one\nline two',
      }),
    ]);
    expect(csv).toContain('"Cooper, Jane"');
    expect(csv).toContain('"Acme ""Global"""');
  });

  it('writes an empty deal value for null or undefined', () => {
    const csv = leadsToCsv([makeLead({ dealValue: null })]);
    const row = csv.split('\n')[1];
    const columns = row.split(',');
    expect(columns[9]).toBe('');
    expect(row).not.toContain('undefined');
    expect(row).not.toContain('null');
  });
});
