import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const SYSTEM_PROMPT = `You are Sproutie, a friendly and knowledgeable support assistant for Sproutie Crochet Studio — a contemporary crochet design studio that sells original bag kits and offers an AI-assisted Bag Design Studio.

Your role:
- Answer questions about crochet bag kits, the AI Bag Design Studio, ordering, materials, and skill levels
- Help users navigate the website and find the right kit for their needs
- Offer encouragement and practical guidance to crafters of all skill levels
- Be warm, concise, and imaginative — match the studio's editorial, design-forward tone
- If you don't know something specific (e.g. live stock, exact shipping times), say so honestly and suggest the user contacts the studio directly

Keep responses concise — 2–4 sentences where possible. Use plain prose, not bullet lists, unless listing steps or materials. Never make up prices, availability, or shipping details you don't know for certain.`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const errorJson = (msg: string, status = 500) =>
  NextResponse.json({ error: msg }, { status })

export async function POST(req: NextRequest) {
  // Trim whitespace and strip any accidental "Bearer " prefix stored in the env var
  const rawKey = process.env.OPENROUTER_API_KEY ?? ''
  const apiKey = rawKey.trim().replace(/^Bearer\s+/i, '')

  if (!apiKey) {
    console.error('[support-chat] OPENROUTER_API_KEY is missing or empty')
    return errorJson('Ask Sproutie is temporarily unavailable. Please try again later.')
  }
  console.log(
    `[support-chat] API key present — prefix: "${apiKey.slice(0, 6)}…" length: ${apiKey.length}`,
  )

  // Accept { messages: [...] } or { message: "string" }
  let messages: Message[]
  try {
    const body = await req.json()
    if (typeof body.message === 'string') {
      messages = [{ role: 'user', content: body.message.trim() }]
    } else if (Array.isArray(body.messages) && body.messages.length > 0) {
      messages = body.messages
    } else {
      return errorJson('Provide either a "message" string or a "messages" array.', 400)
    }
  } catch {
    return errorJson('Invalid JSON body.', 400)
  }

  const fullMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]

  let upstream: Response
  try {
    upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sproutie.studio',
        'X-Title': 'Sproutie Crochet Studio',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b:free',
        messages: fullMessages,
        stream: false,
      }),
    })
  } catch (err) {
    console.error('[support-chat] Fetch to OpenRouter failed:', err)
    return errorJson('Ask Sproutie is temporarily unavailable. Please try again later.')
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '(unreadable)')
    console.error(`[support-chat] OpenRouter error ${upstream.status}:`, text)
    return errorJson('Ask Sproutie is temporarily unavailable. Please try again later.', upstream.status)
  }

  let data: unknown
  try {
    data = await upstream.json()
  } catch {
    console.error('[support-chat] Could not parse OpenRouter JSON response')
    return errorJson('Ask Sproutie is temporarily unavailable. Please try again later.')
  }

  const assistantMessage: string =
    (data as any)?.choices?.[0]?.message?.content?.trim() ?? ''

  if (!assistantMessage) {
    console.error('[support-chat] Empty content in OpenRouter response:', JSON.stringify(data))
    return errorJson('Ask Sproutie is temporarily unavailable. Please try again later.')
  }

  return NextResponse.json({
    assistantMessage,
    suggestedQuestions: [] as string[],
  })
}
