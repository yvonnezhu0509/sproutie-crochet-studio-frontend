'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/cart'
import { buttonVariants } from '@/components/ui/button'

export function CartDrawer() {
  const { items, itemCount, subtotal, drawerOpen, closeDrawer, removeItem, updateQty } =
    useCart()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer()
    }
    if (drawerOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen, closeDrawer])

  // Trap body scroll when open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  // Focus the panel when it opens
  useEffect(() => {
    if (drawerOpen) panelRef.current?.focus()
  }, [drawerOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        className={cn(
          'fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition-opacity duration-300',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-background shadow-2xl transition-transform duration-300 focus:outline-none sm:max-w-md',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4.5 text-primary" />
            <h2 className="font-heading text-lg font-semibold">
              Your Bag
              {itemCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <EmptyCart onClose={closeDrawer} />
          ) : (
            <ul className="flex flex-col gap-5" aria-label="Cart items">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  {/* Image */}
                  <Link
                    href={`/originals/${item.slug}`}
                    onClick={closeDrawer}
                    className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                    aria-label={`View ${item.name}`}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/originals/${item.slug}`}
                        onClick={closeDrawer}
                        className="font-heading text-sm font-semibold leading-snug hover:underline"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="shrink-0 text-muted-foreground/60 transition-colors hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    {/* Variant pills */}
                    <div className="flex flex-wrap gap-1">
                      {item.color && <VariantPill label={item.color} />}
                      {item.size && <VariantPill label={item.size} />}
                      {item.yarnOption && <VariantPill label={item.yarnOption} />}
                    </div>

                    {/* Price + qty row */}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                      <QtyControl
                        qty={item.quantity}
                        onDecrement={() => updateQty(item.id, item.quantity - 1)}
                        onIncrement={() => updateQty(item.id, item.quantity + 1)}
                      />
                      <span className="font-heading text-sm font-semibold">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-5 flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-heading text-xl font-semibold">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              Shipping and taxes calculated at checkout.
            </p>

            <Link
              href="/checkout"
              onClick={closeDrawer}
              className={cn(buttonVariants(), 'h-11 w-full text-sm')}
            >
              Proceed to Checkout
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/cart"
                onClick={closeDrawer}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'h-9 flex-1 text-sm',
                )}
              >
                View Cart
              </Link>
              <button
                type="button"
                onClick={closeDrawer}
                className="h-9 flex-1 rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <ShoppingBag className="size-7 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-heading text-lg font-semibold">Your bag is empty</p>
        <p className="text-sm text-muted-foreground">
          Add a kit to get started on your next make.
        </p>
      </div>
      <Link
        href="/originals"
        onClick={onClose}
        className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
      >
        Browse Kits
      </Link>
    </div>
  )
}

function VariantPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] leading-none text-muted-foreground">
      {label}
    </span>
  )
}

function QtyControl({
  qty,
  onDecrement,
  onIncrement,
}: {
  qty: number
  onDecrement: () => void
  onIncrement: () => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40">
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Decrease quantity"
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Minus className="size-3" />
      </button>
      <span className="w-5 text-center text-sm font-medium tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Increase quantity"
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-3" />
      </button>
    </div>
  )
}
