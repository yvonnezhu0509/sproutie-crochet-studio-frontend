import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are Sproutie, the friendly studio assistant for Sproutie Crochet Studio — an independent crochet bag design studio for North American makers.

Knowledge:
- Studio Originals are original crochet bag kits designed and tested by the studio. Each kit includes everything a maker needs to complete a specific bag.
- The AI Bag Design Studio helps users turn inspiration into a crochet bag concept, a draft pattern direction, and an estimated materials plan. AI-generated designs are drafts, not guaranteed final tested patterns.
- The Community section is for sharing crochet bag concepts, works in progress, finished bags, and constructive feedback.
- Custom materials kits are not automatically available and may require human review.

Rules:
- Be concise, warm, clear, and honest.
- Do not invent inventory, prices, shipping timelines, or policies.
- Do not promise that custom kits are available.
- Do not claim AI-generated patterns are fully tested.
- Do not provide or redistribute paid crochet patterns.
- If human review is needed, say that the studio will need to review the request.
- If the answer is unknown, say so instead of guessing.
- Use US crochet terminology by default.
- Use inches first and centimeters second when relevant.
- Keep replies to 2–4 sentences unless detail is clearly needed. Use plain prose, not bullet lists.

At the end of each reply, suggest 1–3 short follow-up questions as a JSON array in this exact format on its own line:
SUGGESTED: ["question one", "question two"]
If no follow-up questions are relevant, omit the SUGGESTED line entirely.`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // Read and sanitise the API key server-side only
  const rawKey = process.env.OPENROUTER_API_KEY ?? ''
  const apiKey = rawKey.trim().replace(/^Bearer\s+/i, '')

  if (!apiKey) {
    console.error('[support-chat] OPENROUTER_API_KEY is missing or empty')
    return NextResponse.json(
      { error: 'Ask Sproutie is temporarily unavailable. Please try again later.' },
      { status: 500 },
    )
  }

  // Model — override via env var if needed
  const model = (process.env.OPENROUTER_SUPPORT_MODEL ?? 'openai/gpt-oss-120b:free').trim()

  // Parse request body — accept { message } or { messages }
  let userMessages: Message[]
  try {
    const body = await req.json()
    if (typeof body.message === 'string' && body.message.trim()) {
      userMessages = [{ role: 'user', content: body.message.trim() }]
    } else if (Array.isArray(body.messages) && body.messages.length > 0) {
      userMessages = body.messages as Message[]
    } else {
      return NextResponse.json(
        { error: 'Provide either a "message" string or a non-empty "messages" array.' },
        { status: 400 },
      )
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const fullMessages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...userMessages,
  ]

  // Call OpenRouter
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
        model,
        messages: fullMessages,
        stream: false,
        max_tokens: 512,
        reasoning: { enabled: true },
      }),
    })
  } catch (err) {
    console.error('[support-chat] Network error reaching OpenRouter:', err)
    return NextResponse.json(
      { error: 'Ask Sproutie is temporarily unavailable. Please try again later.' },
      { status: 502 },
    )
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '')
    console.error(`[support-chat] OpenRouter responded ${upstream.status}:`, text)
    return NextResponse.json(
      { error: 'Ask Sproutie is temporarily unavailable. Please try again later.' },
      { status: upstream.status },
    )
  }

  let data: any
  try {
    data = await upstream.json()
  } catch {
    console.error('[support-chat] Failed to parse OpenRouter response as JSON')
    return NextResponse.json(
      { error: 'Ask Sproutie is temporarily unavailable. Please try again later.' },
      { status: 500 },
    )
  }

  const raw: string = data?.choices?.[0]?.message?.content?.trim() ?? ''

  if (!raw) {
    console.error('[support-chat] Empty content from OpenRouter. Full response:', JSON.stringify(data))
    return NextResponse.json(
      { error: 'Ask Sproutie is temporarily unavailable. Please try again later.' },
      { status: 500 },
    )
  }

  // Parse optional SUGGESTED line from the model reply
  let assistantMessage = raw
  let suggestedQuestions: string[] = []

  const suggestedMatch = raw.match(/^SUGGESTED:\s*(\[.+?\])\s*$/m)
  if (suggestedMatch) {
    try {
      suggestedQuestions = JSON.parse(suggestedMatch[1])
    } catch { /* ignore malformed suggestions */ }
    // Strip the SUGGESTED line from the visible reply
    assistantMessage = raw.replace(/^SUGGESTED:\s*\[.+?\]\s*$/m, '').trim()
  }

  return NextResponse.json({ assistantMessage, suggestedQuestions })
}
