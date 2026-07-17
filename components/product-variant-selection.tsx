'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface ProductVariantSelectionContextValue {
  selectedVariantId: string
  setSelectedVariantId: (variantId: string) => void
}

const ProductVariantSelectionContext =
  createContext<ProductVariantSelectionContextValue | null>(null)

interface ProviderProps {
  defaultVariantId: string
  children: ReactNode
}

export function ProductVariantSelectionProvider({
  defaultVariantId,
  children,
}: ProviderProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariantId)

  const value = useMemo(
    () => ({
      selectedVariantId,
      setSelectedVariantId,
    }),
    [selectedVariantId],
  )

  return (
    <ProductVariantSelectionContext.Provider value={value}>
      {children}
    </ProductVariantSelectionContext.Provider>
  )
}

export function useProductVariantSelection(): ProductVariantSelectionContextValue {
  const context = useContext(ProductVariantSelectionContext)

  if (!context) {
    throw new Error(
      'useProductVariantSelection must be used inside ProductVariantSelectionProvider',
    )
  }

  return context
}
