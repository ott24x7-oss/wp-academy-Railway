import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You are an AI assistant for WatShop Academy & Marketing Suite.

You help users with:
- Generating social media captions and posts (engaging, on-brand)
- Creating marketing copy (headlines, ad copy, email)
- Summarizing course lessons (concise, actionable takeaways)
- Giving feedback on practice submissions (constructive, specific)
- Auditing ad campaigns (identify issues, suggest improvements)
- Suggesting marketing strategies (data-driven recommendations)

Style: Be concise, professional, and actionable. Use bullet points for lists.
When generating posts, suggest hashtags and CTAs.
When summarizing, lead with the 3 most important takeaways.`

interface ChatRequest {
  message: string
  conversationId?: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      )
    }

    const body: ChatRequest = await request.json()
    const { message, history = [] } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const messages = [
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens

    return NextResponse.json({
      success: true,
      message: text,
      tokensUsed,
      model: MODEL,
    })
  } catch (error) {
    const err = error as Error
    console.error('[ai/chat] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
