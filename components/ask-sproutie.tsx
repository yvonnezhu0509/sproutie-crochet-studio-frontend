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
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  // Use a ref for the ID counter so it's always current inside async closures
  const msgCountRef = useRef(0)

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

  // Keep a stable ref to messages so the streaming closure always sees current history
  const messagesRef = useRef<Message[]>(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    // Use ref counter so IDs are always unique even inside async closures
    const count = msgCountRef.current++
    const userMsgId = `${uid}-u-${count}`
    const assistantMsgId = `${uid}-a-${count}`
    const userMsg: Message = { id: userMsgId, role: 'user', content: trimmed }

    // Snapshot history before updating state
    const history = [...messagesRef.current, userMsg].map(({ role, content }) => ({ role, content }))

    setMessages((prev) => [...prev, userMsg])
    setSuggestedQuestions([])
    setInput('')
    setLoading(true)

    console.log('[v0] Sending Ask Sproutie request to /api/support-chat')

    try {
      const res = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, messages: history }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.assistantMessage) {
        const errMsg = json?.error ?? 'Ask Sproutie is temporarily unavailable. Please try again later.'
        console.error('[v0] Ask Sproutie API error:', res.status, json)
        setMessages((prev) => [
          ...prev,
          { id: assistantMsgId, role: 'assistant', content: errMsg },
        ])
        return
      }

      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: json.assistantMessage },
      ])

      if (Array.isArray(json.suggestedQuestions) && json.suggestedQuestions.length > 0) {
        setSuggestedQuestions(json.suggestedQuestions)
      }
    } catch (err) {
      console.error('[v0] Ask Sproutie fetch failed:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
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

        {/* Suggestion chips — default set when empty, API-returned set after replies */}
        {(isEmpty || (!loading && suggestedQuestions.length > 0)) && (
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-border/50 px-4 py-3 sm:px-5">
            {(isEmpty ? SUGGESTIONS : suggestedQuestions).map((s) => (
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
            AI responses may not always be accurate
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
