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

type OpenRouterMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export async function POST(req: NextRequest) {
  try {
    const rawKey = process.env.OPENROUTER_API_KEY ?? ""
    const apiKey = rawKey.trim().replace(/^Bearer\s+/i, "")

    console.log("[support-chat] key exists:", Boolean(apiKey))
    console.log("[support-chat] key prefix ok:", apiKey.startsWith("sk-or-v1-"))
    console.log("[support-chat] key length:", apiKey.length)

    if (!apiKey) {
      console.error("[support-chat] Missing OPENROUTER_API_KEY")
      return jsonResponse(
        {
          error: "Ask Sproutie is temporarily unavailable. Please try again later.",
          debug: {
            reason: "Missing OPENROUTER_API_KEY",
          },
        },
        500
      )
    }

    const body = await req.json().catch(() => null)

    if (!body || typeof body !== "object") {
      return jsonResponse(
        {
          error: "Invalid JSON body.",
          debug: {
            reason: "Request body is missing or not valid JSON.",
          },
        },
        400
      )
    }

    const rawMessages = Array.isArray((body as any).messages)
      ? (body as any).messages
      : []

    const incomingMessages: IncomingMessage[] = rawMessages
      .filter(
        (m: any) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      )
      .slice(-8)
      .map((m: any) => ({
        role: m.role,
        content: m.content.trim(),
      }))

    const userMessage =
      typeof (body as any).message === "string" &&
      (body as any).message.trim().length > 0
        ? (body as any).message.trim()
        : incomingMessages[incomingMessages.length - 1]?.content

    if (!userMessage) {
      return jsonResponse(
        {
          error: "Message is required.",
          debug: {
            reason: "No message or valid messages array was provided.",
          },
        },
        400
      )
    }

    const conversationMessages: IncomingMessage[] =
      incomingMessages.length > 0
        ? incomingMessages
        : [{ role: "user", content: userMessage }]

    const openRouterMessages: OpenRouterMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationMessages,
    ]

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
        messages: openRouterMessages,
        stream: false,
        temperature: 0.4,
        max_tokens: 500,
      }),
    })

    const rawUpstreamText = await upstream.text()

    let data: any = null

    try {
      data = rawUpstreamText ? JSON.parse(rawUpstreamText) : null
    } catch {
      console.error(
        "[support-chat] OpenRouter returned non-JSON:",
        rawUpstreamText
      )

      return jsonResponse(
        {
          error: "Ask Sproutie is temporarily unavailable. Please try again later.",
          debug: {
            reason: "OpenRouter returned non-JSON response.",
            status: upstream.status,
            raw: rawUpstreamText,
          },
        },
        500
      )
    }

    if (!upstream.ok) {
      console.error(
        "[support-chat] OpenRouter error:",
        upstream.status,
        JSON.stringify(data)
      )

      return jsonResponse(
        {
          error: "Ask Sproutie is temporarily unavailable. Please try again later.",
          debug: {
            reason: "OpenRouter request failed.",
            status: upstream.status,
            upstream: data,
          },
        },
        upstream.status
      )
    }

    const assistantMessage =
      data?.choices?.[0]?.message?.content?.trim() ||
      "I’m sorry, I couldn’t generate a response right now."

    return jsonResponse({
      assistantMessage,
      suggestedQuestions: [
        "How does the AI Bag Design Studio work?",
        "What comes in a Studio Originals kit?",
        "Can I share my own bag design?",
      ],
    })
  } catch (error) {
    console.error("[support-chat] route error:", error)

    return jsonResponse(
      {
        error: "Ask Sproutie is temporarily unavailable. Please try again later.",
        debug:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : {
                message: String(error),
              },
      },
      500
    )
  }
}