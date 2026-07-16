
-- Create product_kit_items table
CREATE TABLE IF NOT EXISTS public.product_kit_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id     uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  category       text NOT NULL,
  item_name      text NOT NULL,
  quantity       numeric(10, 3) NOT NULL DEFAULT 1,
  unit           text NOT NULL DEFAULT '',
  specification  text,
  is_optional    boolean NOT NULL DEFAULT false,
  customer_visible boolean NOT NULL DEFAULT true,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-product lookups
CREATE INDEX IF NOT EXISTS product_kit_items_product_id_idx
  ON public.product_kit_items (product_id);
CREATE INDEX IF NOT EXISTS product_kit_items_variant_id_idx
  ON public.product_kit_items (variant_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_product_kit_items_updated_at ON public.product_kit_items;
CREATE TRIGGER set_product_kit_items_updated_at
  BEFORE UPDATE ON public.product_kit_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.product_kit_items ENABLE ROW LEVEL SECURITY;

-- Public read: product must have a public status AND item must be customer_visible
CREATE POLICY "kit_items_public_read"
  ON public.product_kit_items
  FOR SELECT
  USING (
    customer_visible = true
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.status IN ('coming_soon', 'active', 'sold_out')
    )
  );

-- Admin full access: is_admin must be true in user metadata
CREATE POLICY "kit_items_admin_all"
  ON public.product_kit_items
  FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );
;
