import { Check } from 'lucide-react'
import type { DbKitItem } from '@/lib/catalog'

interface Props {
  items: DbKitItem[]
}

/** Groups customer-visible kit items by category and renders an always-open list. */
export function KitContentsSummary({ items }: Props) {
  const visible = items.filter((i) => i.customer_visible)
  if (visible.length === 0) return null

  // Group while preserving sort order
  const categoryOrder: string[] = []
  const groups: Record<string, DbKitItem[]> = {}
  for (const item of visible) {
    if (!groups[item.category]) {
      categoryOrder.push(item.category)
      groups[item.category] = []
    }
    groups[item.category].push(item)
  }

  return (
    <div className="rounded-xl border border-border px-4 py-4">
      <p className="mb-3 text-sm font-medium">{"What's Included"}</p>

      <div className="flex flex-col gap-4">
        {categoryOrder.map((category) => (
          <div key={category}>
            {categoryOrder.length > 1 && (
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                {category}
              </p>
            )}
            <ul className="flex flex-col gap-1.5">
              {groups[category].map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm">
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">
                    <span className="text-foreground">{item.item_name}</span>
                    {(item.quantity !== 1 || item.unit) && (
                      <span className="ml-1">
                        &times;&thinsp;{item.quantity}
                        {item.unit ? ` ${item.unit}` : ''}
                      </span>
                    )}
                    {item.specification && (
                      <span className="ml-1 text-muted-foreground/70">
                        &mdash; {item.specification}
                      </span>
                    )}
                    {item.is_optional && (
                      <span className="ml-1 text-xs italic text-muted-foreground/60">
                        (optional)
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
