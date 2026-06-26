'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Heart, Bookmark, ArrowUpRight, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { STATUS_LABELS, type CommunityProject, type CommunityComment } from '@/lib/community'

interface Props {
  project: CommunityProject
  onClose: () => void
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-36 shrink-0 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  )
}

function CommentItem({ comment }: { comment: CommunityComment }) {
  return (
    <div className="flex gap-3">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
        aria-hidden="true"
      >
        {comment.avatar}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-medium">{comment.author}</span>
          <span className="text-xs text-muted-foreground">{comment.date}</span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{comment.body}</p>
      </div>
    </div>
  )
}

export function ProjectDetailModal({ project, onClose }: Props) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(project.likes)
  const [saved, setSaved] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<CommunityComment[]>(project.comments)
  const [commentCount, setCommentCount] = useState(0)
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const commentIdPrefix = useId()

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Lock scroll
    document.body.style.overflow = 'hidden'
    // Focus close button
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleSubmitComment = () => {
    if (!commentText.trim()) return
    const newComment: CommunityComment = {
      id: `${commentIdPrefix}-${commentCount}`,
      author: 'you',
      avatar: 'YO',
      date: 'Just now',
      body: commentText.trim(),
    }
    setComments((prev) => [...prev, newComment])
    setCommentCount((n) => n + 1)
    setCommentText('')
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div className="relative flex h-[92svh] w-full max-w-4xl flex-col overflow-hidden bg-background sm:h-auto sm:max-h-[90svh] sm:rounded-2xl">
        {/* Close */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {project.creatorInitials}
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{project.creator}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{project.bagType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLiked((prev) => {
                  setLikeCount((c) => (prev ? c - 1 : c + 1))
                  return !prev
                })
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors',
                liked
                  ? 'bg-warm/10 text-warm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Heart className={cn('size-3.5', liked && 'fill-current')} />
              {likeCount}
            </button>
            <button
              type="button"
              onClick={() => setSaved((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors',
                saved
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Bookmark className={cn('size-3.5', saved && 'fill-current')} />
              Save
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="ml-1 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
            {/* Left — image */}
            <div className="relative aspect-[4/3] bg-muted lg:aspect-auto lg:min-h-[480px]">
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <Badge
                  variant={
                    project.status === 'finished'
                      ? 'default'
                      : project.status === 'wip'
                        ? 'secondary'
                        : 'outline'
                  }
                  className="text-xs"
                >
                  {STATUS_LABELS[project.status]}
                </Badge>
                {project.aiAssisted && (
                  <Badge variant="outline" className="border-primary/30 bg-background/80 text-xs text-primary backdrop-blur">
                    AI-assisted
                  </Badge>
                )}
              </div>
            </div>

            {/* Right — detail */}
            <div className="flex flex-col gap-6 px-6 py-6">
              <div>
                <h2 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
                  {project.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
              </div>

              <Separator />

              <dl className="flex flex-col gap-3">
                <MetaRow label="Inspiration" value={project.inspiration} />
                <MetaRow label="Bag type" value={project.bagType} />
                <MetaRow label="Dimensions" value={project.dimensions} />
                <MetaRow label="Skill level" value={project.difficulty} />
                <MetaRow label="Construction" value={project.constructionMethod} />
              </dl>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Materials used</p>
                <ul className="flex flex-col gap-1">
                  {project.materials.map((m) => (
                    <li key={m} className="text-sm text-foreground">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>

              {project.constructionNotes && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Construction notes
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {project.constructionNotes}
                  </p>
                </div>
              )}

              {project.creatorNotes && (
                <div className="rounded-xl bg-muted px-4 py-3">
                  <p className="mb-1 text-xs font-medium text-foreground">Creator note</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {project.creatorNotes}
                  </p>
                </div>
              )}

              <Link
                href="/design"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'mt-auto h-9 gap-1.5 text-sm',
                )}
              >
                Inspired by this? Start your own design
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Discussion */}
          <div className="border-t border-border/60 px-6 py-6">
            <h3 className="mb-5 font-heading text-base font-semibold">
              Discussion
              {comments.length > 0 && (
                <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
                  {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                </span>
              )}
            </h3>

            {comments.length > 0 ? (
              <div className="mb-6 flex flex-col gap-5">
                {comments.map((c) => (
                  <CommentItem key={c.id} comment={c} />
                ))}
              </div>
            ) : (
              <p className="mb-6 text-sm text-muted-foreground">
                No comments yet. Be the first to share a thought.
              </p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitComment()
                  }
                }}
                placeholder="Share a thought about color, construction, or materials…"
                className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Add a comment"
              />
              <Button
                type="button"
                size="icon"
                variant="default"
                onClick={handleSubmitComment}
                aria-label="Submit comment"
                disabled={!commentText.trim()}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
