export interface CartItem {
  /** Stable cart-line key composed from product and configuration fields. */
  id: string
  productId: string
  /** Future: ID of an AI-generated design. */
  designId?: string
  variantId?: string
  variantName?: string
  name: string
  slug: string
  image: string
  color?: string
  size?: string
  yarnOption?: string
  accessories?: string[]
  quantity: number
  unitPrice: number
}

export type CartItemInput = Omit<CartItem, 'id'>

export function makeCartLineId(
  item: Omit<CartItem, 'id' | 'quantity'>,
): string {
  return [
    item.productId,
    item.designId ?? '',
    item.variantId ?? '',
    item.color ?? '',
    item.size ?? '',
    item.yarnOption ?? '',
  ]
    .join('|')
    .replace(/\|+$/, '')
}

export function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  )
}

export function mergeCartItems(
  currentItems: CartItem[],
  incomingItems: CartItem[],
): CartItem[] {
  const merged = new Map<string, CartItem>()

  for (const item of [...currentItems, ...incomingItems]) {
    const existing = merged.get(item.id)

    if (existing) {
      merged.set(item.id, {
        ...existing,
        ...item,
        quantity: Math.min(99, existing.quantity + item.quantity),
      })
    } else {
      merged.set(item.id, {
        ...item,
        quantity: Math.min(99, Math.max(1, item.quantity)),
      })
    }
  }

  return [...merged.values()]
}

export function parseStoredCartItems(raw: string | null): CartItem[] {
  if (!raw) return []

  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []

    return value.filter(isCartItem)
  } catch {
    return []
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false

  const item = value as Partial<CartItem>

  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.productId === 'string' &&
    item.productId.length > 0 &&
    typeof item.name === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.image === 'string' &&
    Number.isInteger(item.quantity) &&
    Number(item.quantity) >= 1 &&
    Number(item.quantity) <= 99 &&
    typeof item.unitPrice === 'number' &&
    Number.isFinite(item.unitPrice) &&
    item.unitPrice >= 0
  )
}
