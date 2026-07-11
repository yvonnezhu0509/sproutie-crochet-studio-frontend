'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * CartItem is intentionally forward-compatible with AI-generated custom
 * designs. Fields that are not yet used can be left undefined.
 */
export interface CartItem {
  /** Stable cart-line key composed from productId + variant fingerprint */
  id: string
  productId: string
  /** Future: ID of an AI-generated design */
  designId?: string
  variantId?: string
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLineId(item: Omit<CartItem, 'id' | 'quantity'>): string {
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

function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id'> }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_QTY'; id: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] }

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.items

    case 'ADD_ITEM': {
      const id = makeLineId(action.payload)
      const existing = state.find((i) => i.id === id)
      if (existing) {
        return state.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + action.payload.quantity } : i,
        )
      }
      return [...state, { ...action.payload, id }]
    }

    case 'REMOVE_ITEM':
      return state.filter((i) => i.id !== action.id)

    case 'UPDATE_QTY':
      if (action.quantity < 1) return state.filter((i) => i.id !== action.id)
      return state.map((i) =>
        i.id === action.id ? { ...i, quantity: action.quantity } : i,
      )

    case 'CLEAR':
      return []

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  /** Cart drawer open state */
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'sproutie_cart_v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [])
  const [drawerOpen, setDrawerOpen] = useReducer(
    (_: boolean, next: boolean) => next,
    false,
  )

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: 'HYDRATE', items: parsed })
        }
      }
    } catch {
      // Ignore corrupt storage
    }
  }, [])

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore storage errors (e.g. private browsing quota)
    }
  }, [items])

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
  }, [])

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', id })
  }, [])

  const updateQty = useCallback((id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QTY', id, quantity })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const itemCount = items.reduce((n, i) => n + i.quantity, 0)
  const subtotal = cartSubtotal(items)

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        drawerOpen,
        openDrawer,
        closeDrawer,
        addItem,
        removeItem,
        updateQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
