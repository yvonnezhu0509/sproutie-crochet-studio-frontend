'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/cart'
import { buttonVariants } from '@/components/ui/button'

export default function CartPage() {
  const { items, subtotal, removeItem, updateQty, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-9 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold">Your bag is empty</h1>
          <p className="text-pretty text-muted-foreground">
            You haven&apos;t added anything yet. Browse the studio originals to find your next make.
          </p>
        </div>
        <Link href="/originals" className={cn(buttonVariants(), 'h-11 px-8')}>
          Browse Kits
        </Link>
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
      <div className="mb-10 flex items-baseline justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">Your Bag</h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-16">
        {/* Items list */}
        <section aria-label="Cart items">
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex gap-5 py-6 sm:gap-7">
                {/* Image */}
                <Link
                  href={`/originals/${item.slug}`}
                  className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-32 sm:w-28"
                  aria-label={`View ${item.name}`}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(min-width: 640px) 112px, 96px"
                    className="object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/originals/${item.slug}`}
                      className="font-heading text-lg font-semibold leading-snug hover:underline"
                    >
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {/* Variant pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.color && <VariantPill label={item.color} />}
                    {item.size && <VariantPill label={item.size} />}
                    {item.yarnOption && <VariantPill label={item.yarnOption} />}
                  </div>

                  {/* Price per unit */}
                  <p className="text-sm text-muted-foreground">
                    ${item.unitPrice.toFixed(2)} each
                  </p>

                  {/* Qty + line total */}
                  <div className="mt-auto flex items-center justify-between gap-4 pt-2">
                    <QtyControl
                      qty={item.quantity}
                      onDecrement={() => updateQty(item.id, item.quantity - 1)}
                      onIncrement={() => updateQty(item.id, item.quantity + 1)}
                    />
                    <span className="font-heading text-lg font-semibold">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Continue shopping */}
          <div className="mt-4">
            <Link
              href="/originals"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Continue Shopping
            </Link>
          </div>
        </section>

        {/* Order summary */}
        <aside aria-label="Order summary">
          <div className="rounded-2xl border border-border bg-card p-6 sticky top-20">
            <h2 className="font-heading text-xl font-semibold mb-5">Order Summary</h2>

            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd className="font-medium text-foreground">${subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>Shipping</dt>
                <dd>Calculated at checkout</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>Taxes</dt>
                <dd>Calculated at checkout</dd>
              </div>
              <div className="my-1 h-px bg-border" />
              <div className="flex justify-between">
                <dt className="font-semibold">Total</dt>
                <dd className="font-heading text-xl font-semibold">
                  ${subtotal.toFixed(2)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/checkout"
                className={cn(buttonVariants(), 'h-12 w-full text-sm')}
              >
                Proceed to Checkout
              </Link>
              <p className="text-center text-xs text-muted-foreground">
                Secure checkout powered by Sproutie House
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function VariantPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
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
    <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40">
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Decrease quantity"
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-7 text-center text-sm font-medium tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Increase quantity"
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
