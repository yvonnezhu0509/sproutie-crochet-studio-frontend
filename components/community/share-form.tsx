'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { communityGuidelines } from '@/lib/community'

type FormState = 'idle' | 'submitting' | 'success'

export function ShareForm() {
  const [state, setState] = useState<FormState>('idle')
  const [values, setValues] = useState({
    title: '',
    status: '',
    bagType: '',
    story: '',
    materials: '',
    dimensions: '',
    difficulty: '',
    construction: '',
    feedbackRequested: '',
    designLink: '',
  })

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.title || !values.status || !values.story) return
    setState('submitting')
    setTimeout(() => setState('success'), 1200)
  }

  const inputClass =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
  const labelClass = 'block text-xs font-medium text-foreground mb-1.5'

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle className="size-10 text-primary" aria-hidden="true" />
        <h3 className="font-heading text-xl font-semibold">Submission received.</h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Your project has been submitted to the community. It will appear in the gallery once
          reviewed. Thank you for sharing.
        </p>
        <button
          type="button"
          onClick={() => {
            setState('idle')
            setValues({
              title: '', status: '', bagType: '', story: '', materials: '',
              dimensions: '', difficulty: '', construction: '', feedbackRequested: '', designLink: '',
            })
          }}
          className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Share another project
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Project title */}
        <div className="sm:col-span-2">
          <label htmlFor="title" className={labelClass}>
            Project title <span className="text-muted-foreground">(required)</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={values.title}
            onChange={set('title')}
            placeholder="e.g. Late October Crescent"
            className={inputClass}
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className={labelClass}>
            Project status <span className="text-muted-foreground">(required)</span>
          </label>
          <select
            id="status"
            required
            value={values.status}
            onChange={set('status')}
            className={inputClass}
          >
            <option value="">Select status</option>
            <option value="concept">Concept — design idea only</option>
            <option value="wip">Work in Progress</option>
            <option value="finished">Finished Bag</option>
          </select>
        </div>

        {/* Bag type */}
        <div>
          <label htmlFor="bagType" className={labelClass}>
            Bag type
          </label>
          <select
            id="bagType"
            value={values.bagType}
            onChange={set('bagType')}
            className={inputClass}
          >
            <option value="">Select bag type</option>
            <option>Tote Bag</option>
            <option>Shoulder Bag</option>
            <option>Crossbody Bag</option>
            <option>Crescent Bag</option>
            <option>Bucket Bag</option>
            <option>Mini Bag</option>
            <option>Other</option>
          </select>
        </div>

        {/* Story */}
        <div className="sm:col-span-2">
          <label htmlFor="story" className={labelClass}>
            Story or inspiration <span className="text-muted-foreground">(required)</span>
          </label>
          <textarea
            id="story"
            required
            rows={4}
            value={values.story}
            onChange={set('story')}
            placeholder="What inspired this design? What problem or feeling were you working with?"
            className={inputClass}
          />
        </div>

        {/* Image upload placeholder */}
        <div className="sm:col-span-2">
          <p className={labelClass}>Project image</p>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
            Image upload — coming soon
          </div>
        </div>

        {/* Materials */}
        <div className="sm:col-span-2">
          <label htmlFor="materials" className={labelClass}>
            Yarn and materials
          </label>
          <textarea
            id="materials"
            rows={3}
            value={values.materials}
            onChange={set('materials')}
            placeholder="List each yarn, handle, hardware, and lining material used."
            className={inputClass}
          />
        </div>

        {/* Dimensions */}
        <div>
          <label htmlFor="dimensions" className={labelClass}>
            Dimensions
          </label>
          <input
            id="dimensions"
            type="text"
            value={values.dimensions}
            onChange={set('dimensions')}
            placeholder='e.g. 13" wide × 11" tall × 3" deep'
            className={inputClass}
          />
        </div>

        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty" className={labelClass}>
            Skill level
          </label>
          <select
            id="difficulty"
            value={values.difficulty}
            onChange={set('difficulty')}
            className={inputClass}
          >
            <option value="">Select skill level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Construction notes */}
        <div className="sm:col-span-2">
          <label htmlFor="construction" className={labelClass}>
            Construction notes
          </label>
          <textarea
            id="construction"
            rows={3}
            value={values.construction}
            onChange={set('construction')}
            placeholder="Stitch pattern, technique notes, anything useful for someone reading the project."
            className={inputClass}
          />
        </div>

        {/* Feedback requested */}
        <div className="sm:col-span-2">
          <label htmlFor="feedbackRequested" className={labelClass}>
            Feedback you are looking for
          </label>
          <input
            id="feedbackRequested"
            type="text"
            value={values.feedbackRequested}
            onChange={set('feedbackRequested')}
            placeholder="e.g. Color balance, handle choice, whether to continue the motif to the top."
            className={inputClass}
          />
        </div>

        {/* Design Studio link */}
        <div className="sm:col-span-2">
          <label htmlFor="designLink" className={labelClass}>
            Design Studio draft link{' '}
            <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="designLink"
            type="url"
            value={values.designLink}
            onChange={set('designLink')}
            placeholder="https://sproutie.studio/design/…"
            className={inputClass}
          />
        </div>
      </div>

      {/* Ownership notice */}
      <p className="rounded-xl bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        Community submissions are shared for inspiration and discussion. Creators retain ownership
        of their original designs.
      </p>

      <Button
        type="submit"
        disabled={!values.title || !values.status || !values.story || state === 'submitting'}
        className="h-11 w-full sm:w-auto sm:self-start px-8 text-sm"
      >
        {state === 'submitting' ? 'Submitting…' : 'Submit to Community'}
      </Button>
    </form>
  )
}
