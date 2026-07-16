import type {
  DbImage,
  DbInventory,
  DbKitItem,
  DbProduct,
  DbVariant,
  ProductStatus,
} from '@/lib/catalog'

export type PublicationStatus = Extract<
  ProductStatus,
  'coming_soon' | 'active' | 'sold_out'
>

export type ReadinessSeverity = 'blocker' | 'warning'

export interface PublicationReadinessCheck {
  id: string
  label: string
  description: string
  passed: boolean
  severity: ReadinessSeverity
}

export interface ProductPublicationReadiness {
  ready: boolean
  checks: PublicationReadinessCheck[]
  blockers: PublicationReadinessCheck[]
  warnings: PublicationReadinessCheck[]
}

interface ReadinessInput {
  targetStatus: PublicationStatus
  product: Pick<
    DbProduct,
    | 'name'
    | 'slug'
    | 'short_description'
    | 'description'
    | 'base_price_cents'
    | 'difficulty'
    | 'estimated_making_time'
    | 'sale_mode'
  >
  metadata?: Record<string, unknown>
  variants: DbVariant[]
  images: DbImage[]
  inventory: DbInventory[]
  kitItems: DbKitItem[]
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function metadataText(
  metadata: Record<string, unknown>,
  key: string,
): string {
  const value = metadata[key]
  return typeof value === 'string' ? value.trim() : ''
}

function metadataList(
  metadata: Record<string, unknown>,
  key: string,
): string[] {
  const value = metadata[key]
  if (!Array.isArray(value)) return []

  return value.filter(
    (item): item is string =>
      typeof item === 'string' && item.trim().length > 0,
  )
}

export function evaluateProductPublicationReadiness({
  targetStatus,
  product,
  metadata = {},
  variants,
  images,
  inventory,
  kitItems,
}: ReadinessInput): ProductPublicationReadiness {
  const checks: PublicationReadinessCheck[] = []

  function addCheck(
    id: string,
    label: string,
    description: string,
    passed: boolean,
    severity: ReadinessSeverity = 'blocker',
  ) {
    checks.push({ id, label, description, passed, severity })
  }

  const requiresFullLaunchDetails = targetStatus === 'active' || targetStatus === 'sold_out'
  const activeVariants = variants.filter((variant) => variant.is_active)
  const sortedImages = [...images].sort((a, b) =>
    a.sort_order === b.sort_order
      ? a.created_at.localeCompare(b.created_at)
      : a.sort_order - b.sort_order,
  )
  const primaryImage = sortedImages[0]

  addCheck(
    'product-name',
    'Product name',
    'Add a product name before publication.',
    hasText(product.name),
  )

  addCheck(
    'product-slug',
    'Product URL slug',
    'Add a URL-safe product slug before publication.',
    hasText(product.slug),
  )

  addCheck(
    'short-description',
    'Short description',
    'Add a concise description for product cards and previews.',
    hasText(product.short_description),
  )

  addCheck(
    'full-description',
    'Full description',
    'Add the complete product story and description before launch.',
    hasText(product.description),
    requiresFullLaunchDetails ? 'blocker' : 'warning',
  )

  addCheck(
    'base-price',
    'Valid price',
    'Set a base price greater than zero.',
    Number.isInteger(product.base_price_cents) && product.base_price_cents > 0,
  )

  addCheck(
    'difficulty',
    'Difficulty level',
    'Specify the crochet difficulty level.',
    hasText(product.difficulty),
    requiresFullLaunchDetails ? 'blocker' : 'warning',
  )

  addCheck(
    'making-time',
    'Estimated making time',
    'Specify how long the project usually takes.',
    hasText(product.estimated_making_time),
    requiresFullLaunchDetails ? 'blocker' : 'warning',
  )

  addCheck(
    'tagline',
    'Product tagline',
    'Add a concise tagline for product cards and the product page.',
    hasText(metadataText(metadata, 'tagline')),
    requiresFullLaunchDetails ? 'blocker' : 'warning',
  )

  addCheck(
    'bag-type',
    'Bag type',
    'Specify the product’s bag type.',
    hasText(metadataText(metadata, 'bagType')),
    requiresFullLaunchDetails ? 'blocker' : 'warning',
  )

  addCheck(
    'construction-details',
    'Construction details',
    'Describe the construction method or construction overview.',
    hasText(metadataText(metadata, 'construction')) ||
      hasText(metadataText(metadata, 'constructionOverview')),
    'warning',
  )

  addCheck(
    'techniques',
    'Crochet techniques',
    'List at least one crochet technique used in the project.',
    metadataList(metadata, 'techniques').length > 0,
    requiresFullLaunchDetails ? 'blocker' : 'warning',
  )

  addCheck(
    'dimensions',
    'Finished dimensions',
    'Add finished dimensions in inches or centimeters.',
    hasText(metadataText(metadata, 'dimensionsIn')) ||
      hasText(metadataText(metadata, 'dimensionsCm')),
    'warning',
  )

  addCheck(
    'pattern-format',
    'Pattern format',
    'Describe how the pattern will be provided.',
    hasText(metadataText(metadata, 'patternFormat')),
    'warning',
  )

  addCheck(
    'availability-label',
    'Availability label',
    'Add a customer-facing availability label.',
    hasText(metadataText(metadata, 'availability')),
    'warning',
  )

  addCheck(
    'primary-image',
    'Primary product image',
    'Upload at least one product image.',
    Boolean(primaryImage),
  )

  addCheck(
    'primary-image-alt',
    'Primary image alt text',
    'Add descriptive alt text to the primary image.',
    Boolean(primaryImage?.alt_text?.trim()),
    requiresFullLaunchDetails ? 'blocker' : 'warning',
  )

  addCheck(
    'active-variant',
    'Active product variant',
    'Create and activate at least one purchasable variant.',
    activeVariants.length > 0,
  )

  addCheck(
    'variant-skus',
    'Variant SKUs',
    'Every active variant must have a SKU.',
    activeVariants.length > 0 &&
      activeVariants.every((variant) => hasText(variant.sku)),
  )

  addCheck(
    'variant-prices',
    'Variant pricing',
    'Every active variant must have its own price or inherit a valid base price.',
    activeVariants.length > 0 &&
      activeVariants.every(
        (variant) =>
          variant.price_cents > 0 || product.base_price_cents > 0,
      ),
  )

  const inventoryByVariant = new Map(
    inventory.map((row) => [row.variant_id, row]),
  )

  const inventoryModesValid = activeVariants.every((variant) => {
    if (product.sale_mode === 'digital') {
      return variant.inventory_mode === 'unlimited'
    }

    if (product.sale_mode === 'stocked') {
      return variant.inventory_mode !== 'unlimited'
    }

    return true
  })

  addCheck(
    'inventory-modes',
    'Inventory modes',
    'Variant inventory modes must match the product sale mode.',
    activeVariants.length > 0 && inventoryModesValid,
  )

  const assembledVariants = activeVariants.filter(
    (variant) => variant.inventory_mode === 'assembled',
  )

  addCheck(
    'assembled-inventory',
    'Assembled inventory records',
    'Every assembled-stock variant must have an inventory record.',
    assembledVariants.every((variant) =>
      inventoryByVariant.has(variant.id),
    ),
  )

  if (
    targetStatus === 'active' &&
    product.sale_mode === 'stocked' &&
    assembledVariants.length > 0
  ) {
    addCheck(
      'available-stock',
      'Available assembled stock',
      'An active stocked product must have available inventory.',
      assembledVariants.some((variant) => {
        const row = inventoryByVariant.get(variant.id)
        return Boolean(
          row &&
            row.track_inventory &&
            row.quantity_on_hand - row.quantity_reserved > 0,
        )
      }),
    )
  }

  const applicableKitItems = kitItems.filter(
    (item) =>
      item.variant_id === null ||
      activeVariants.some((variant) => variant.id === item.variant_id),
  )

  if (product.sale_mode !== 'digital') {
    addCheck(
      'customer-visible-kit-items',
      'Customer-visible kit contents',
      'Add at least one customer-visible item included in the kit.',
      applicableKitItems.some((item) => item.customer_visible),
    )
  }

  const componentVariants = activeVariants.filter(
    (variant) => variant.inventory_mode === 'component_based',
  )

  if (componentVariants.length > 0) {
    const requiredComponentItems = applicableKitItems.filter(
      (item) => !item.is_optional,
    )

    addCheck(
      'component-material-links',
      'Component material links',
      'Required component-based recipe items must link to inventory materials.',
      requiredComponentItems.length > 0 &&
        requiredComponentItems.every((item) => Boolean(item.material_id)),
    )
  }

  if (product.sale_mode !== 'digital') {
    const requiredItems = applicableKitItems.filter(
      (item) => !item.is_optional,
    )

    addCheck(
      'recipe-verification',
      'Recipe verification',
      'Required kit items should be marked production ready before launch.',
      requiredItems.length > 0 &&
        requiredItems.every(
          (item) => item.verification_status === 'production_ready',
        ),
      requiresFullLaunchDetails ? 'blocker' : 'warning',
    )
  }

  const blockers = checks.filter(
    (check) => check.severity === 'blocker' && !check.passed,
  )
  const warnings = checks.filter(
    (check) => check.severity === 'warning' && !check.passed,
  )

  return {
    ready: blockers.length === 0,
    checks,
    blockers,
    warnings,
  }
}
