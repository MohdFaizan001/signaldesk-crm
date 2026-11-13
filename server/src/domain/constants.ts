export const LEAD_STATUSES = ['new', 'contacted', 'interested', 'negotiation', 'converted', 'lost'] as const;
export const LEAD_PRIORITIES = ['low', 'medium', 'high'] as const;
export const LEAD_SOURCES = [
  'website',
  'referral',
  'linkedin',
  'cold-call',
  'email-campaign',
  'trade-show',
  'partner',
] as const;
export const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note'] as const;
export const FOLLOW_UP_TYPES = ['call', 'email', 'meeting', 'demo', 'proposal'] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];

export const LEAD_SORT_FIELDS = ['full_name', 'created_at', 'updated_at', 'deal_value', 'priority', 'status'] as const;
export type LeadSortField = (typeof LEAD_SORT_FIELDS)[number];
