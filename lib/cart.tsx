'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  calculateCartSubtotal,
  makeCartLineId,
  mergeCartItems,
  parseStoredCartItems,
  type CartItem,
  type CartItemInput,
} from '@/lib/cart-model'
import {
  loadAuthenticatedCart,
  replaceAuthenticatedCart,
} from '@/lib/cart-persistence'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItemInput }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_QTY'; id: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] }

function clampQuantity(quantity: number): number {
  return Math.min(99, Math.max(1, Math.trunc(quantity)))
}

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.items

    case 'ADD_ITEM': {
      const id = makeCartLineId(action.payload)
      const existing = state.find((item) => item.id === id)

      if (existing) {
        return state.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: clampQuantity(
                  item.quantity + action.payload.quantity,
                ),
              }
            : item,
        )
      }

      return [
        ...state,
        {
          ...action.payload,
          id,
          quantity: clampQuantity(action.payload.quantity),
        },
      ]
    }

    case 'REMOVE_ITEM':
      return state.filter((item) => item.id !== action.id)

    case 'UPDATE_QTY':
      if (action.quantity < 1) {
        return state.filter((item) => item.id !== action.id)
      }

      return state.map((item) =>
        item.id === action.id
          ? { ...item, quantity: clampQuantity(action.quantity) }
          : item,
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
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  addItem: (item: CartItemInput) => void
  removeItem: (id: string) => void
  updateQty: (id: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'sproutie_cart_v1'
const PERSIST_DELAY_MS = 300

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [])
  const [drawerOpen, setDrawerOpen] = useReducer(
    (_: boolean, next: boolean) => next,
    false,
  )
  const [authenticatedUserId, setAuthenticatedUserId] =
    useState<string | null>(null)
  const [syncReady, setSyncReady] = useState(false)

  const currentUserIdRef = useRef<string | null>(null)
  const observedSessionUserIdRef = useRef<string | null | undefined>(
    undefined,
  )
  const hydrationSequenceRef = useRef(0)
  const skipNextAuthenticatedPersistRef = useRef(false)
  const persistenceQueueRef = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function hydrateForUser(userId: string | null) {
      const sequence = ++hydrationSequenceRef.current

      currentUserIdRef.current = userId
      setAuthenticatedUserId(userId)
      setSyncReady(false)
      dispatch({ type: 'HYDRATE', items: [] })

      if (!userId) {
        const guestItems = parseStoredCartItems(
          localStorage.getItem(STORAGE_KEY),
        )

        if (cancelled || sequence !== hydrationSequenceRef.current) return

        dispatch({ type: 'HYDRATE', items: guestItems })
        setSyncReady(true)
        return
      }

      try {
        const guestItems = parseStoredCartItems(
          localStorage.getItem(STORAGE_KEY),
        )
        const databaseItems = await loadAuthenticatedCart(supabase, userId)

        if (cancelled || sequence !== hydrationSequenceRef.current) return

        let hydratedItems = databaseItems

        if (guestItems.length > 0) {
          const mergedItems = mergeCartItems(
            guestItems,
            databaseItems,
          )

          try {
            await replaceAuthenticatedCart(supabase, mergedItems)

            if (
              cancelled ||
              sequence !== hydrationSequenceRef.current
            ) {
              return
            }

            hydratedItems = await loadAuthenticatedCart(supabase, userId)

            if (
              cancelled ||
              sequence !== hydrationSequenceRef.current
            ) {
              return
            }

            localStorage.removeItem(STORAGE_KEY)
          } catch (mergeError) {
            console.error(
              '[cart] Could not merge guest cart into account cart:',
              mergeError instanceof Error
                ? mergeError.message
                : mergeError,
            )
          }
        }

        skipNextAuthenticatedPersistRef.current = true
        dispatch({ type: 'HYDRATE', items: hydratedItems })
        setSyncReady(true)
      } catch (error) {
        if (cancelled || sequence !== hydrationSequenceRef.current) return

        console.error(
          '[cart] Could not hydrate authenticated cart:',
          error instanceof Error ? error.message : error,
        )
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null

      if (observedSessionUserIdRef.current === nextUserId) return
      observedSessionUserIdRef.current = nextUserId

      window.setTimeout(() => {
        void hydrateForUser(nextUserId)
      }, 0)
    })

    return () => {
      cancelled = true
      hydrationSequenceRef.current += 1
      subscription.unsubscribe()
    }
  }, [])

  // Guest carts remain browser-local.
  useEffect(() => {
    if (!syncReady || authenticatedUserId) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore storage errors such as private-browsing quota failures.
    }
  }, [authenticatedUserId, items, syncReady])

  // Authenticated carts are persisted atomically through the database RPC.
  useEffect(() => {
    if (!syncReady || !authenticatedUserId) return

    if (skipNextAuthenticatedPersistRef.current) {
      skipNextAuthenticatedPersistRef.current = false
      return
    }

    const userId = authenticatedUserId
    const snapshot = items
    const timer = window.setTimeout(() => {
      persistenceQueueRef.current = persistenceQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (currentUserIdRef.current !== userId) return

          const supabase = createClient()

          try {
            await replaceAuthenticatedCart(supabase, snapshot)
          } catch (error) {
            console.error(
              '[cart] Could not persist authenticated cart:',
              error instanceof Error ? error.message : error,
            )
          }
        })
    }, PERSIST_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [authenticatedUserId, items, syncReady])

  const addItem = useCallback((item: CartItemInput) => {
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

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0,
  )
  const subtotal = calculateCartSubtotal(items)

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
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside <CartProvider>')
  }

  return context
}
