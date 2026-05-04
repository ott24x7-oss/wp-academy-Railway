/**
 * Unified AI provider dispatcher.
 * Supports: Anthropic Claude, Google Gemini, OpenRouter (any model).
 *
 * Env vars:
 *   ANTHROPIC_API_KEY    → Claude
 *   GEMINI_API_KEY       → Gemini
 *   OPENROUTER_API_KEY   → OpenRouter (proxy to OpenAI, Llama, Mistral, etc.)
 */

import Anthropic from '@anthropic-ai/sdk'

export type AIProvider = 'anthropic' | 'gemini' | 'openrouter'

export interface AIGenerateOptions {
  provider?: AIProvider
  model?: string
  system?: string
  prompt: string
  maxTokens?: number
  temperature?: number
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface AIGenerateResult {
  text: string
  provider: AIProvider
  model: string
  tokensUsed?: number
}

const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: 'claude-haiku-4-5-20251001',
  gemini: 'gemini-2.0-flash',
  openrouter: 'meta-llama/llama-3.3-70b-instruct:free',
}

function pickProvider(requested?: AIProvider): AIProvider {
  if (requested) return requested
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.OPENROUTER_API_KEY) return 'openrouter'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  throw new Error('No AI provider configured. Set GEMINI_API_KEY, OPENROUTER_API_KEY, or ANTHROPIC_API_KEY.')
}

// ─── Anthropic ───────────────────────────────────────
async function generateAnthropic(opts: AIGenerateOptions): Promise<AIGenerateResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set')
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const model = opts.model || DEFAULT_MODELS.anthropic
  const messages = [
    ...(opts.history || []).slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: opts.prompt },
  ]
  const res = await client.messages.create({
    model,
    max_tokens: opts.maxTokens || 1024,
    temperature: opts.temperature ?? 0.7,
    system: opts.system || '',
    messages,
  })
  const text = res.content[0].type === 'text' ? res.content[0].text : ''
  return {
    text,
    provider: 'anthropic',
    model,
    tokensUsed: res.usage.input_tokens + res.usage.output_tokens,
  }
}

// ─── Gemini ──────────────────────────────────────────
async function generateGemini(opts: AIGenerateOptions): Promise<AIGenerateResult> {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set')
  const model = opts.model || DEFAULT_MODELS.gemini

  const contents = [
    ...(opts.history || []).slice(-10).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: opts.prompt }] },
  ]

  const body: any = {
    contents,
    generationConfig: {
      maxOutputTokens: opts.maxTokens || 1024,
      temperature: opts.temperature ?? 0.7,
    },
  }
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Gemini error ${res.status}`)
  }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const tokensUsed =
    (json.usageMetadata?.promptTokenCount || 0) +
    (json.usageMetadata?.candidatesTokenCount || 0)
  return { text, provider: 'gemini', model, tokensUsed }
}

// ─── OpenRouter ──────────────────────────────────────
async function generateOpenRouter(opts: AIGenerateOptions): Promise<AIGenerateResult> {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not set')
  const model = opts.model || DEFAULT_MODELS.openrouter

  const messages: any[] = []
  if (opts.system) messages.push({ role: 'system', content: opts.system })
  for (const m of (opts.history || []).slice(-10)) {
    messages.push({ role: m.role, content: m.content })
  }
  messages.push({ role: 'user', content: opts.prompt })

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.SITE_URL || 'https://academy.watshop.in',
      'X-Title': 'WatShop Academy',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: opts.maxTokens || 1024,
      temperature: opts.temperature ?? 0.7,
    }),
  })
  const json = await res.json()
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `OpenRouter error ${res.status}`)
  }
  const text = json.choices?.[0]?.message?.content || ''
  const tokensUsed = json.usage?.total_tokens || 0
  return { text, provider: 'openrouter', model, tokensUsed }
}

// ─── Master dispatcher ───────────────────────────────
export async function generateAI(opts: AIGenerateOptions): Promise<AIGenerateResult> {
  const provider = pickProvider(opts.provider)
  switch (provider) {
    case 'anthropic':
      return generateAnthropic(opts)
    case 'gemini':
      return generateGemini(opts)
    case 'openrouter':
      return generateOpenRouter(opts)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

export function listAvailableProviders(): AIProvider[] {
  const out: AIProvider[] = []
  if (process.env.GEMINI_API_KEY) out.push('gemini')
  if (process.env.OPENROUTER_API_KEY) out.push('openrouter')
  if (process.env.ANTHROPIC_API_KEY) out.push('anthropic')
  return out
}

// ─── Prompt templates ────────────────────────────────
export const SYSTEM_PROMPTS = {
  socialPost: `You are a social media copywriter. Generate engaging, scroll-stopping posts.
Rules:
- Match the requested platform's vibe (Twitter=witty, LinkedIn=professional, Instagram=visual storytelling)
- Include 3-5 relevant hashtags at the end
- End with a soft CTA (question, invitation, or hook)
- Keep within platform character limits (Twitter 280, others flexible)
- No emoji spam — at most 2-3, only if they fit`,

  dailyQuote: `You are an inspirational content writer for entrepreneurs and marketers.
Generate a single short daily message (2-4 sentences max) that is:
- Original (not a famous quote — write fresh)
- Actionable or thought-provoking
- Aligned with the requested theme
- No hashtags, no emoji, just the message text`,

  dailyQuestion: `You are a discussion-prompt writer for an entrepreneur community.
Generate ONE engaging question that:
- Is open-ended (no yes/no)
- Provokes real reflection or shared experience
- Is short enough for social media (under 200 chars)
- No hashtags, just the question`,

  blogIntro: `You are a content marketer. Write a compelling blog intro (3-4 sentences) that:
- Hooks the reader immediately
- Sets up the value the rest of the post delivers
- Uses concrete language, no fluff`,
}
