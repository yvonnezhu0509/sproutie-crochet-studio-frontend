'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Send, ChevronDown, Sparkles, Loader } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_HEIGHT = 480
const MIN_HEIGHT = 360
const STORAGE_KEY = 'ask-sproutie-panel-height'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// ---------------------------------------------------------------------------
// Mock responses — swap for a real API route when ready
// ---------------------------------------------------------------------------
const MOCK_RESPONSES: Record<string, string> = {
  default:
    "Hi! I'm Sproutie, your crochet studio guide. I can help with kit details, the Design Studio, materials, skill levels, and shipping. What would you like to know?",
  kit: "Our kits include everything you need — curated yarn, hardware, handles, a written pattern, and a photo guide. Each kit is designed to be made at home with standard hooks you likely already own.",
  design:
    "The Design Studio is our AI-assisted bag design tool. You pick a style, size, colors, and handles through a guided flow. At the end you get a design summary and a materials list. It's still a prototype — we're refining it.",
  shipping:
    "We ship within North America. Standard shipping takes 5–10 business days. We're working on international options — join the newsletter to hear when they launch.",
  skill:
    "Our kits are designed for intermediate crocheters — you should be comfortable with single and half-double crochet, basic tension control, and joining yarn. Beginners with a few finished projects will do fine.",
  price:
    "Kit prices range from $48 to $84 USD depending on the bag style and included materials. Prices include all yarn, hardware, and pattern access.",
  yarn: "We use high-quality 100% cotton yarn in each kit — it's durable, washable, and holds structure well for bags. Each kit specifies the exact weight and meterage needed.",
}

function getMockResponse(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('kit') || lower.includes('include') || lower.includes('what') && lower.includes('get'))
    return MOCK_RESPONSES.kit
  if (lower.includes('design') || lower.includes('studio') || lower.includes('ai') || lower.includes('tool'))
    return MOCK_RESPONSES.design
  if (lower.includes('ship') || lower.includes('deliver') || lower.includes('international'))
    return MOCK_RESPONSES.shipping
  if (lower.includes('skill') || lower.includes('level') || lower.includes('beginner') || lower.includes('hard'))
    return MOCK_RESPONSES.skill
  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('$'))
    return MOCK_RESPONSES.price
  if (lower.includes('yarn') || lower.includes('material') || lower.includes('fiber') || lower.includes('cotton'))
    return MOCK_RESPONSES.yarn
  return "That's a great question. I don't have a specific answer for that right now, but you can reach us via the newsletter signup — we read every reply and will get back to you."
}

// ---------------------------------------------------------------------------
// Suggestion chips shown in the empty state
// ---------------------------------------------------------------------------
const SUGGESTIONS = [
  "What's in a kit?",
  "How does the Design Studio work?",
  "What skill level do I need?",
  "How much do kits cost?",
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AskSproutie() {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [msgCount, setMsgCount] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // ---- Resize state (desktop only) ----
  const [panelHeight, setPanelHeight] = useState<number>(DEFAULT_HEIGHT)
  const dragStartY = useRef<number>(0)
  const dragStartH = useRef<number>(0)
  const isResizing = useRef(false)

  // Restore persisted height on mount (client-only)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed >= MIN_HEIGHT) setPanelHeight(parsed)
    }
  }, [])

  const getMaxHeight = () =>
    typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.8) : 800

  const clampHeight = (h: number) =>
    Math.max(MIN_HEIGHT, Math.min(getMaxHeight(), h))

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Desktop only: skip when panel is not a floating panel (< sm breakpoint)
      if (window.innerWidth < 640) return
      e.preventDefault()
      isResizing.current = true
      dragStartY.current = e.clientY
      dragStartH.current = panelRef.current?.offsetHeight ?? panelHeight
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [panelHeight],
  )

  const onResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing.current) return
    // Dragging up (negative delta) → increase height
    const delta = dragStartY.current - e.clientY
    const next = clampHeight(dragStartH.current + delta)
    setPanelHeight(next)
  }, [])

  const onResizePointerUp = useCallback(() => {
    if (!isResizing.current) return
    isResizing.current = false
    const h = panelRef.current?.offsetHeight ?? panelHeight
    const clamped = clampHeight(h)
    setPanelHeight(clamped)
    localStorage.setItem(STORAGE_KEY, String(clamped))
  }, [panelHeight])

  const resetHeight = useCallback(() => {
    setPanelHeight(DEFAULT_HEIGHT)
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_HEIGHT))
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Prevent body scroll on mobile when open
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg: Message = { id: `${uid}-${msgCount}`, role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setMsgCount((n) => n + 1)
    setInput('')
    setLoading(true)

    // Simulate a short delay for realism
    setTimeout(() => {
      const reply: Message = {
        id: `${uid}-${msgCount + 1}`,
        role: 'assistant',
        content: getMockResponse(trimmed),
      }
      setMessages((prev) => [...prev, reply])
      setMsgCount((n) => n + 2)
      setLoading(false)
    }, 700 + Math.random() * 400)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Mobile backdrop — only when open on small screens                */}
      {/* ---------------------------------------------------------------- */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm sm:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Chat panel                                                        */}
      {/* ---------------------------------------------------------------- */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ask Sproutie — chat support"
        style={{ '--panel-h': `${panelHeight}px` } as React.CSSProperties}
        className={cn(
          // Base — fixed, sits above everything
          'fixed z-50 flex flex-col overflow-hidden shadow-2xl transition-[transform,opacity] duration-300',
          // Mobile: bottom sheet — slides up from bottom, fixed 80dvh
          'bottom-0 left-0 right-0 rounded-t-2xl border border-border bg-card',
          'h-[80dvh]',
          // Desktop: floating panel with user-controlled height
          'sm:bottom-6 sm:left-auto sm:right-6 sm:w-[380px] sm:rounded-2xl',
          'sm:h-[var(--panel-h)] sm:min-h-[360px] sm:max-h-[80vh]',
          open
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-full opacity-0 pointer-events-none sm:translate-y-4',
        )}
      >
        {/* Resize handle — desktop only, drag to resize vertically */}
        <div
          aria-hidden="true"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onDoubleClick={resetHeight}
          title="Drag to resize · Double-click to reset"
          className="group hidden shrink-0 cursor-ns-resize touch-none select-none items-center justify-center py-1.5 sm:flex"
        >
          <div className="h-1 w-8 rounded-full bg-border transition-colors group-hover:bg-muted-foreground/40" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-3.5" />
            </span>
            <div>
              <p className="font-heading text-sm font-semibold leading-tight">Ask Sproutie</p>
              <p className="text-xs text-muted-foreground">Studio support</p>
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
          {/* Welcome message */}
          <div className="flex gap-2.5">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-3" />
            </span>
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed">
              Hi! I&apos;m Sproutie. Ask me about kits, the Design Studio, materials, or shipping.
            </div>
          </div>

          {/* Conversation */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2.5',
                msg.role === 'user' && 'flex-row-reverse',
              )}
            >
              {msg.role === 'assistant' && (
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="size-3" />
                </span>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  msg.role === 'assistant'
                    ? 'rounded-tl-sm bg-muted text-foreground'
                    : 'rounded-tr-sm bg-primary text-primary-foreground',
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div className="flex gap-2.5">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="size-3" />
              </span>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-3">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips — show only when no user messages yet */}
        {isEmpty && (
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-border/50 px-4 py-3 sm:px-5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-accent-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="shrink-0 border-t border-border bg-card px-4 py-3 sm:px-5">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              aria-label="Type your message"
              className="max-h-28 min-h-[38px] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <Loader className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
            Prototype responses only — not a live support channel
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* FAB — collapsed trigger button                                   */}
      {/* ---------------------------------------------------------------- */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Ask Sproutie chat' : 'Open Ask Sproutie chat'}
        aria-expanded={open}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full shadow-lg transition-all duration-200',
          'bg-primary text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring',
          open
            ? 'scale-95 opacity-0 pointer-events-none'
            : 'scale-100 opacity-100',
          // Collapsed: pill with label on desktop, round on mobile
          'h-12 px-5 sm:h-12',
        )}
      >
        <Sparkles className="size-4 shrink-0" />
        <span className="font-heading text-sm font-semibold">Ask Sproutie</span>
      </button>
    </>
  )
}
