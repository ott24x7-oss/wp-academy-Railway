import { NextResponse, type NextRequest } from 'next/server'
import { generateAI, listAvailableProviders, SYSTEM_PROMPTS, type AIProvider } from '@/lib/ai-providers'

interface GenerateRequest {
  type: 'social-post' | 'daily-quote' | 'daily-question' | 'blog-intro' | 'custom'
  topic: string
  platform?: 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok'
  tone?: 'casual' | 'professional' | 'witty' | 'inspirational' | 'educational'
  variants?: number
  provider?: AIProvider
  model?: string
  customSystem?: string
}

function buildSystemPrompt(req: GenerateRequest): string {
  switch (req.type) {
    case 'social-post':
      return SYSTEM_PROMPTS.socialPost
    case 'daily-quote':
      return SYSTEM_PROMPTS.dailyQuote
    case 'daily-question':
      return SYSTEM_PROMPTS.dailyQuestion
    case 'blog-intro':
      return SYSTEM_PROMPTS.blogIntro
    case 'custom':
      return req.customSystem || 'You are a helpful content writer.'
  }
}

function buildUserPrompt(req: GenerateRequest, variantIndex: number): string {
  const tone = req.tone || 'professional'
  if (req.type === 'social-post') {
    return `Write a ${tone} social media post for ${req.platform || 'Twitter'} about: ${req.topic}\n\nVariant ${variantIndex + 1}: make this version distinct from others — try a different angle, hook, or structure.`
  }
  if (req.type === 'daily-quote') {
    return `Generate a daily inspirational message about: ${req.topic}\nTone: ${tone}\nVariant ${variantIndex + 1}: make it different from prior variants.`
  }
  if (req.type === 'daily-question') {
    return `Generate a discussion question about: ${req.topic}\nVariant ${variantIndex + 1}: take a different angle.`
  }
  if (req.type === 'blog-intro') {
    return `Write a blog intro about: ${req.topic}\nTone: ${tone}`
  }
  return req.topic
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest
    const { topic, variants = 1 } = body

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'topic required' }, { status: 400 })
    }

    const available = listAvailableProviders()
    if (available.length === 0) {
      return NextResponse.json(
        {
          error:
            'No AI provider configured. Add GEMINI_API_KEY (free at aistudio.google.com/apikey) or OPENROUTER_API_KEY (free at openrouter.ai/keys) to environment variables.',
        },
        { status: 503 }
      )
    }

    const system = buildSystemPrompt(body)
    const count = Math.min(Math.max(variants, 1), 5)

    const promises = Array.from({ length: count }).map((_, i) =>
      generateAI({
        provider: body.provider,
        model: body.model,
        system,
        prompt: buildUserPrompt(body, i),
        temperature: 0.85,
        maxTokens: body.type === 'blog-intro' ? 400 : 300,
      }).catch((e: Error) => ({ error: e.message }))
    )

    const settled = await Promise.all(promises)
    const results = settled.filter((r): r is { text: string; provider: AIProvider; model: string; tokensUsed?: number } => 'text' in r)
    const errors = settled.filter((r): r is { error: string } => 'error' in r)

    if (results.length === 0) {
      return NextResponse.json(
        { error: errors[0]?.error || 'All generation attempts failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      variants: results.map((r) => ({
        text: r.text,
        provider: r.provider,
        model: r.model,
        tokensUsed: r.tokensUsed,
      })),
      partialErrors: errors.length > 0 ? errors.map((e) => e.error) : undefined,
    })
  } catch (error) {
    const err = error as Error
    console.error('[ai/generate] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    providers: listAvailableProviders(),
    types: ['social-post', 'daily-quote', 'daily-question', 'blog-intro', 'custom'],
  })
}
