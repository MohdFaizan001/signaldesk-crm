import { GoogleGenAI } from '@google/genai';
import type { ZodType } from 'zod';
import { env, isGeminiConfigured } from './env.js';
import { ApiError } from '../utils/ApiError.js';

export const geminiModel = env.GEMINI_MODEL;
const client = isGeminiConfigured ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY as string }) : null;

export const aiProvider = {
  configured: Boolean(client),
  model: geminiModel,
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  const candidate = start >= 0 && end > start ? withoutFence.slice(start, end + 1) : withoutFence;
  return JSON.parse(candidate);
}

export async function generateJson<T>(prompt: string, schema: ZodType<T>): Promise<{ data: T; model: string }> {
  if (!client) {
    throw ApiError.serviceUnavailable('Gemini is not configured', 'AI_NOT_CONFIGURED');
  }
  try {
    const response = await client.models.generateContent({
      model: geminiModel,
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.4 },
    });
    const text = response.text;
    if (!text) throw new Error('Empty AI response');
    const parsed = schema.safeParse(extractJson(text));
    if (!parsed.success) {
      throw new Error('AI response did not match the expected schema');
    }
    return { data: parsed.data, model: geminiModel };
  } catch (error) {
    if (!isGeminiConfigured) throw error;
    // Never echo provider payloads; keep customer data out of logs.
    console.error('[SignalDesk AI] Gemini request failed:', error instanceof Error ? error.message : 'unknown error');
    throw new ApiError(502, 'The AI provider could not produce a valid response. Please try again.', {
      code: 'AI_PROVIDER_ERROR',
    });
  }
}

export async function generateText(prompt: string): Promise<{ text: string; model: string }> {
  if (!client) {
    throw ApiError.serviceUnavailable('Gemini is not configured', 'AI_NOT_CONFIGURED');
  }
  try {
    const response = await client.models.generateContent({
      model: geminiModel,
      contents: prompt,
      config: { temperature: 0.3, maxOutputTokens: 1024 },
    });
    const text = response.text?.trim();
    if (!text) throw new Error('Empty AI response');
    return { text, model: geminiModel };
  } catch (error) {
    console.error('[SignalDesk AI] Gemini request failed:', error instanceof Error ? error.message : 'unknown error');
    throw new ApiError(502, 'The AI provider is temporarily unavailable. Please try again.', {
      code: 'AI_PROVIDER_ERROR',
    });
  }
}
