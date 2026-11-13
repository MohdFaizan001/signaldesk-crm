import { describe, expect, it } from 'vitest';
import { deriveFollowUpStatus, mapFollowUp } from '../modules/followups/followups.service.js';

const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();

describe('deriveFollowUpStatus', () => {
  it('treats any completed follow-up as completed regardless of due date', () => {
    expect(deriveFollowUpStatus(past, new Date().toISOString())).toBe('completed');
    expect(deriveFollowUpStatus(future, new Date().toISOString())).toBe('completed');
  });

  it('derives overdue from the due date without storing it', () => {
    expect(deriveFollowUpStatus(past, null)).toBe('overdue');
  });

  it('derives upcoming from a future due date', () => {
    expect(deriveFollowUpStatus(future, null)).toBe('upcoming');
  });
});

describe('mapFollowUp', () => {
  it('maps snake_case rows and related lead/profile names', () => {
    const mapped = mapFollowUp({
      id: 'follow-up-id',
      lead_id: 'lead-id',
      title: 'Discovery call',
      description: null,
      type: 'call',
      due_at: future,
      priority: 'high',
      assigned_to: 'user-id',
      completed_at: null,
      created_by: 'user-id',
      created_at: future,
      updated_at: future,
      lead: { id: 'lead-id', full_name: 'Jane Cooper', company: 'Acme' },
      assigned: { id: 'user-id', full_name: 'Sam Rep' },
    });

    expect(mapped).toMatchObject({
      id: 'follow-up-id',
      leadName: 'Jane Cooper',
      company: 'Acme',
      assignedTo: 'Sam Rep',
      assignedToId: 'user-id',
      description: '',
      status: 'upcoming',
    });
  });
});
