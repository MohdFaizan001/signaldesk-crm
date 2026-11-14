import type { AiLeadFilters } from './ai.schemas.js';

export type AiProviderName = 'gemini' | 'mock';

export interface LeadInsight {
  id: string;
  leadId: string;
  leadName: string;
  score: number;
  conversionProbability: number;
  summary: string;
  reasoning: string;
  positiveSignals: string[];
  riskFactors: string[];
  missingInformation: string[];
  nextBestAction: string;
  suggestedMessage: string;
  model: string;
  provider: AiProviderName;
  createdAt: string;
}

export interface AiMeta {
  provider: AiProviderName;
  model: string;
}

export interface ChatResult extends AiMeta {
  answer: string;
}

export interface SearchResult extends AiMeta {
  filters: AiLeadFilters;
  items: unknown[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface DailySummaryResult extends AiMeta {
  summary: string;
  generatedAt: string;
  metrics: {
    newLeads: number;
    convertedLeads: number;
    lostLeads: number;
    pendingFollowUps: number;
    overdueFollowUps: number;
    pipelineValue: number;
  };
}
