import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const SYSTEM_PROMPT = `
You are Ask Sproutie, the studio assistant for Sproutie Crochet Studio.

Sproutie Crochet Studio is an independent crochet bag design studio for North American makers. It offers Studio Originals, which are original crochet bag kits designed and tested by the studio, and an AI Bag Design Studio, which helps users turn inspiration into a crochet bag concept, draft pattern direction, and estimated materials plan.

The current website is an early-stage prototype. AI-generated designs and patterns are drafts, not guaranteed final tested patterns. Custom materials kits are not automatically available yet and may require human review for construction feasibility, material compatibility, sourcing, and pricing.

Community is for sharing crochet bag concepts, works in progress, finished bags, and constructive feedback. Users should credit original designers and should not upload or redistribute paid patterns.

Use US crochet terminology by default. Use inches first and centimeters second when measurements are relevant.

Be concise, warm, clear, honest, and helpful.

Do not invent live inventory, prices, shipping timelines, refunds, or order status.
Do not claim AI-generated patterns are fully tested.
Do not provide or recreate paid crochet patterns.
If the user is rude, stay calm and redirect to Sproutie-related support.
`

type IncomingMessage = {
  role: "user" | "assistant"
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const rawKey = process.env.OPENROUTER_API_KEY ?? ""
    const apiKey = rawKey.trim().replace(/^Bearer\s+/i, "")

    if (!apiKey) {
      console.error("[support-chat] Missing OPENROUTER_API_KEY")
      return NextResponse.json(
        { error: "Ask Sproutie is temporarily unavailable. Please try again later." },
        { status: 500 }
      )
    }

    const body = await req.json()

    const incomingMessages: IncomingMessage[] = Array.isArray(body.messages)
      ? body.messages
          .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-8)
      : []

    const userMessage =
      typeof body.message === "string"
        ? body.message
        : incomingMessages[incomingMessages.length - 1]?.content

    if (!userMessage) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      )
    }

    const messages =
      incomingMessages.length > 0
        ? incomingMessages
        : [{ role: "user" as const, content: userMessage }]

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://sproutie.studio",
        "X-Title": "Sproutie Crochet Studio",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_SUPPORT_MODEL || "openrouter/free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: false,
        temperature: 0.4,
        max_tokens: 500,
      }),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      console.error("[support-chat] OpenRouter error:", upstream.status, JSON.stringify(data))
      return NextResponse.json(
        { error: "Ask Sproutie is temporarily unavailable. Please try again later." },
        { status: upstream.status }
      )
    }

    const assistantMessage =
      data?.choices?.[0]?.message?.content ||
      "I’m sorry, I couldn’t generate a response right now."

    return NextResponse.json({
      assistantMessage,
      suggestedQuestions: [
        "How does the AI Bag Design Studio work?",
        "What comes in a Studio Originals kit?",
        "Can I share my own bag design?",
      ],
    })
  } catch (error) {
    console.error("[support-chat] route error:", error)
    return NextResponse.json(
      { error: "Ask Sproutie is temporarily unavailable. Please try again later." },
      { status: 500 }
    )
  }
}

console.log("[support-chat] key exists:", Boolean(apiKey))
console.log("[support-chat] key prefix ok:", apiKey.startsWith("sk-or-v1-"))
console.log("[support-chat] key length:", apiKey.length)