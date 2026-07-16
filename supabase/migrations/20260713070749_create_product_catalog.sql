
-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Product status enum
CREATE TYPE public.product_status AS ENUM (
  'draft',
  'coming_soon',
  'active',
  'sold_out',
  'archived'
);

-- Products
CREATE TABLE public.products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  short_description    TEXT,
  description          TEXT,
  status               public.product_status NOT NULL DEFAULT 'draft',
  base_price_cents     INTEGER NOT NULL DEFAULT 0,
  currency             TEXT NOT NULL DEFAULT 'USD',
  difficulty           TEXT,
  estimated_making_time TEXT,
  is_featured          BOOLEAN NOT NULL DEFAULT false,
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Product variants
CREATE TABLE public.product_variants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku          TEXT,
  variant_name TEXT NOT NULL,
  option_values JSONB NOT NULL DEFAULT '{}',
  price_cents  INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Product images
CREATE TABLE public.product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id  UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  image_url   TEXT NOT NULL,
  alt_text    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory (one row per variant)
CREATE TABLE public.inventory (
  variant_id           UUID PRIMARY KEY REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity_on_hand     INTEGER NOT NULL DEFAULT 0,
  quantity_reserved    INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold  INTEGER NOT NULL DEFAULT 5,
  track_inventory      BOOLEAN NOT NULL DEFAULT true,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Admin helper: checks JWT user_metadata.is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
$$;

-- Products RLS
CREATE POLICY "products_public_select" ON public.products
  FOR SELECT USING (status IN ('coming_soon', 'active', 'sold_out'));

CREATE POLICY "products_admin_all" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Product variants RLS
CREATE POLICY "variants_public_select" ON public.product_variants
  FOR SELECT USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.status IN ('coming_soon', 'active', 'sold_out')
    )
  );

CREATE POLICY "variants_admin_all" ON public.product_variants
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Product images RLS
CREATE POLICY "images_public_select" ON public.product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.status IN ('coming_soon', 'active', 'sold_out')
    )
  );

CREATE POLICY "images_admin_all" ON public.product_images
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Inventory RLS
CREATE POLICY "inventory_public_select" ON public.inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      WHERE pv.id = variant_id
        AND p.status IN ('coming_soon', 'active', 'sold_out')
    )
  );

CREATE POLICY "inventory_admin_all" ON public.inventory
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
;
