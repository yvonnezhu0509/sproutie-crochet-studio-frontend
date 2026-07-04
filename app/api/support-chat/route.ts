import { NextRequest } from 'next/server'

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

interface RequestBody {
  messages: Message[]
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'OPENROUTER_API_KEY is not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages } = body
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Prepend system prompt
  const fullMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
      stream: true,
      reasoning: { enabled: true },
    }),
  })

  if (!upstream.ok) {
    const text = await upstream.text()
    return new Response(
      JSON.stringify({ error: `OpenRouter error ${upstream.status}: ${text}` }),
      { status: upstream.status, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Pass the SSE stream straight through to the client, but filter out
  // reasoning-only delta chunks so only content tokens reach the UI.
  const reader = upstream.body!.getReader()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
          return
        }

        const chunk = decoder.decode(value, { stream: true })
        // Each chunk may contain multiple SSE lines
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            // Pass blank lines / comments through to keep SSE framing intact
            controller.enqueue(encoder.encode(line + '\n'))
            continue
          }

          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            continue
          }

          try {
            const parsed = JSON.parse(data)
            const delta = parsed?.choices?.[0]?.delta ?? {}
            // Only forward chunks that carry visible content; skip reasoning-only deltas
            if (delta.content !== undefined && delta.content !== null) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`))
            }
          } catch {
            // Malformed JSON — pass through as-is
            controller.enqueue(encoder.encode(line + '\n\n'))
          }
        }
      }
    },
    cancel() {
      reader.cancel()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
