'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, ChevronDown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const WELCOME =
  "Hi, I'm Sproutie's studio assistant. I can help with kits, design drafts, materials, and how the studio works."

const STARTER_QUESTIONS = [
  'How does the AI Bag Design Studio work?',
  'What comes in a Studio Originals kit?',
  'Can I share my own bag design?',
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AskSproutie() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  // Stable ref so async send() always reads current messages
  const messagesRef = useRef<Message[]>([])
  // Monotonic counter for unique message IDs — a ref avoids stale closures
  const idxRef = useRef(0)

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
  }, [open])

  // Escape closes the panel
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Prevent body scroll on mobile when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // ------------------------------------------------------------------
  // Send
  // ------------------------------------------------------------------
  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const idx = idxRef.current++
    const userMsg: Message = { role: 'user', content: trimmed }
    const history = [...messagesRef.current, userMsg]

    setMessages(history)
    setSuggestedQuestions([])
    setInput('')
    setLoading(true)

    console.log('Sending Ask Sproutie request to /api/support-chat')

    try {
      const res = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || typeof json?.assistantMessage !== 'string') {
        const errMsg =
          json?.error ??
          'Ask Sproutie is temporarily unavailable. Please try again later.'
        setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }])
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: json.assistantMessage }])

      if (Array.isArray(json.suggestedQuestions) && json.suggestedQuestions.length > 0) {
        setSuggestedQuestions(json.suggestedQuestions)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Ask Sproutie is temporarily unavailable. Please try again later.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(input)
    }
  }

  const isEmpty = messages.length === 0
  const showStarters = isEmpty && !loading
  const showSuggested = !isEmpty && !loading && suggestedQuestions.length > 0

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Chat panel                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ask Sproutie chat"
        aria-hidden={!open}
        className={cn(
          'fixed z-50 flex flex-col overflow-hidden border border-border bg-card shadow-2xl',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0 h-[82dvh] rounded-t-2xl',
          // Desktop: floating panel
          'sm:bottom-6 sm:left-auto sm:right-6 sm:h-[520px] sm:w-[380px] sm:rounded-2xl',
          // Open/close transition
          'transition-[transform,opacity] duration-300 ease-out',
          open
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-4 opacity-0 pointer-events-none',
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-3.5" />
            </span>
            <div>
              <p className="font-heading text-sm font-semibold leading-tight">Ask Sproutie</p>
              <p className="text-[11px] text-muted-foreground">Studio assistant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5">
          {/* Welcome */}
          <AssistantBubble content={WELCOME} />

          {/* Conversation */}
          {messages.map((msg, i) =>
            msg.role === 'assistant' ? (
              <AssistantBubble key={i} content={msg.content} />
            ) : (
              <UserBubble key={i} content={msg.content} />
            ),
          )}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-2.5">
              <BotAvatar />
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-3">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Chips */}
        {(showStarters || showSuggested) && (
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-border/50 px-4 py-3 sm:px-5">
            {(showStarters ? STARTER_QUESTIONS : suggestedQuestions).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-border px-4 py-3 sm:px-5">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              aria-label="Type your message"
              disabled={loading}
              className="max-h-28 min-h-[38px] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-60"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground/50">
            AI responses may not always be accurate
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FAB                                                                  */}
      {/* ------------------------------------------------------------------ */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Ask Sproutie chat' : 'Open Ask Sproutie chat'}
        aria-expanded={open}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-primary-foreground shadow-lg transition-all duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring',
          open ? 'scale-90 opacity-0 pointer-events-none' : 'scale-100 opacity-100',
        )}
      >
        <Sparkles className="size-4 shrink-0" />
        <span className="font-heading text-sm font-semibold">Ask Sproutie</span>
      </button>
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function BotAvatar() {
  return (
    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <Sparkles className="size-3" />
    </span>
  )
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-2.5">
      <BotAvatar />
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
        {content}
      </div>
    </div>
  )
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex flex-row-reverse gap-2.5">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
        {content}
      </div>
    </div>
  )
}
