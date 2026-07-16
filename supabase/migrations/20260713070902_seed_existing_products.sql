
DO $$
DECLARE
  p_aquarium   UUID;
  p_shell      UUID;
  p_crescent   UUID;
  v_aquarium   UUID;
  v_shell      UUID;
  v_crescent   UUID;
BEGIN

  -- ----------------------------------------------------------------
  -- Aquarium Window Bag
  -- ----------------------------------------------------------------
  INSERT INTO public.products (
    name, slug, short_description, description, status,
    base_price_cents, currency, difficulty, estimated_making_time,
    is_featured, metadata
  ) VALUES (
    'Aquarium Window Bag',
    'aquarium-window-bag',
    'A structured tote with a clear vinyl panel framed by tapestry-crochet waves and drifting fish.',
    'The Aquarium Window Bag started as a doodle of a tide pool seen through fogged glass. We wanted a bag that felt like peeking into a small, calm world, so we framed a clear vinyl panel with tapestry-crochet waves in cool greens and watery blues. The body is worked firmly to hold its shape, and the window is reinforced so it can carry a paperback or a small plant without sagging.',
    'coming_soon',
    6800,
    'USD',
    'Intermediate',
    '18–24 hours',
    true,
    '{
      "tagline": "A clear little window into a tiny stitched sea.",
      "bagType": "Tote",
      "construction": "Tapestry crochet",
      "constructionOverview": "The front and back panels are worked flat in tapestry crochet, the vinyl window is sewn into a crocheted frame, and the gusset and base are added before the lining is hand-stitched in.",
      "dimensionsIn": "13 in W × 12 in H × 4 in D",
      "dimensionsCm": "(33 cm × 30 cm × 10 cm)",
      "kitContents": ["3 colors of worsted-weight cotton-blend yarn","Pre-cut clear vinyl window panel","Cotton lining fabric, pre-cut","Two pre-punched faux-leather handles","Magnetic snap closure","Printed stitch chart and step-by-step photo guide"],
      "toolsNotIncluded": ["4.0 mm (G) crochet hook","Yarn needle","Stitch markers","Fabric scissors"],
      "techniques": ["Single crochet","Tapestry crochet color changes","Working into a chain edge","Whip-stitch seaming"],
      "patternFormat": "Printed booklet plus a downloadable PDF with photo tutorials",
      "customizationOptions": ["Swap the wave colorway for a sunset palette","Choose black or cognac faux-leather handles","Add an interior key loop"],
      "careInstructions": ["Spot clean the crochet with a damp cloth and mild soap","Wipe the vinyl window with a soft, dry cloth","Lay flat to dry, away from direct heat"],
      "availability": "Waitlist"
    }'::jsonb
  ) RETURNING id INTO p_aquarium;

  INSERT INTO public.product_variants (product_id, sku, variant_name, price_cents, is_active)
  VALUES (p_aquarium, 'AWB-DEFAULT', 'Standard', 6800, true)
  RETURNING id INTO v_aquarium;

  INSERT INTO public.product_images (product_id, image_url, alt_text, sort_order)
  VALUES
    (p_aquarium, '/products/aquarium-window-bag.png', 'Aquarium Window Bag crochet bag', 0),
    (p_aquarium, '/products/aquarium-window-bag-detail.png', 'Aquarium Window Bag detail', 1),
    (p_aquarium, '/products/aquarium-window-bag-styled.png', 'Aquarium Window Bag styled', 2);

  INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, track_inventory)
  VALUES (v_aquarium, 0, 0, false);

  -- ----------------------------------------------------------------
  -- Shell Shoulder Bag
  -- ----------------------------------------------------------------
  INSERT INTO public.products (
    name, slug, short_description, description, status,
    base_price_cents, currency, difficulty, estimated_making_time,
    is_featured, metadata
  ) VALUES (
    'Shell Shoulder Bag',
    'shell-shoulder-bag',
    'A rounded shoulder bag built from overlapping shell stitches in a warm, muted palette.',
    'We kept coming back to the rhythm of the shell stitch — the way it ripples like sand after a wave pulls back. The Shell Shoulder Bag leans into that texture with a gentle scalloped surface and a slouchy, lived-in shape. A removable strap lets it move from a relaxed shoulder bag to a shorter underarm carry.',
    'active',
    5400,
    'USD',
    'Confident Beginner',
    '12–16 hours',
    true,
    '{
      "tagline": "Soft scalloped texture that sits close at the hip.",
      "bagType": "Shoulder Bag",
      "construction": "Worked in the round",
      "constructionOverview": "The body is worked in continuous rounds of shell stitch, shaped with a flat oval base, then finished with a folded crochet strap and a fabric lining.",
      "dimensionsIn": "11 in W × 9 in H × 3 in D",
      "dimensionsCm": "(28 cm × 23 cm × 8 cm)",
      "kitContents": ["2 colors of DK-weight cotton yarn","Cotton lining fabric, pre-cut","Removable adjustable crochet strap pattern","Magnetic snap closure","Printed stitch chart and written pattern"],
      "toolsNotIncluded": ["3.5 mm (E) crochet hook","Yarn needle","Stitch markers"],
      "techniques": ["Single crochet","Shell stitch","Working in continuous rounds","Oval base shaping"],
      "patternFormat": "Printed booklet plus a downloadable PDF",
      "customizationOptions": ["Two-tone or single-color shell pattern","Short underarm strap or long shoulder strap","Add an exterior slip pocket"],
      "careInstructions": ["Hand wash cold with mild detergent","Reshape while damp and lay flat to dry","Store stuffed lightly to keep its shape"],
      "availability": "Early Access"
    }'::jsonb
  ) RETURNING id INTO p_shell;

  INSERT INTO public.product_variants (product_id, sku, variant_name, price_cents, is_active)
  VALUES (p_shell, 'SSB-DEFAULT', 'Standard', 5400, true)
  RETURNING id INTO v_shell;

  INSERT INTO public.product_images (product_id, image_url, alt_text, sort_order)
  VALUES
    (p_shell, '/products/shell-shoulder-bag.png', 'Shell Shoulder Bag crochet bag', 0),
    (p_shell, '/products/shell-shoulder-bag-detail.png', 'Shell Shoulder Bag detail', 1),
    (p_shell, '/products/shell-shoulder-bag-styled.png', 'Shell Shoulder Bag styled', 2);

  INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, track_inventory)
  VALUES (v_shell, 50, 0, true);

  -- ----------------------------------------------------------------
  -- Everyday Crescent Bag
  -- ----------------------------------------------------------------
  INSERT INTO public.products (
    name, slug, short_description, description, status,
    base_price_cents, currency, difficulty, estimated_making_time,
    is_featured, metadata
  ) VALUES (
    'Everyday Crescent Bag',
    'everyday-crescent-bag',
    'A simple half-moon crescent bag in a calm two-color palette — a relaxed first project.',
    'Sometimes you just want a bag that goes with everything and works up fast. The Everyday Crescent Bag is our most approachable kit: a clean half-moon shape, a single repeating stitch, and a soft color-block detail you can make subtle or bold. It is the one we reach for on quiet mornings.',
    'active',
    4200,
    'USD',
    'Beginner',
    '8–12 hours',
    true,
    '{
      "tagline": "The easy, go-anywhere crescent for daily carry.",
      "bagType": "Crescent Bag",
      "construction": "Worked flat & seamed",
      "constructionOverview": "The crescent is worked flat in rows with simple increases, folded and seamed up the sides, then finished with a crochet strap and an optional lining.",
      "dimensionsIn": "12 in W × 7 in H × 2 in D",
      "dimensionsCm": "(30 cm × 18 cm × 5 cm)",
      "kitContents": ["2 colors of worsted-weight cotton-blend yarn","Crochet strap pattern","Optional cotton lining fabric, pre-cut","Printed written pattern with diagrams"],
      "toolsNotIncluded": ["4.0 mm (G) crochet hook","Yarn needle","Stitch markers"],
      "techniques": ["Single crochet","Half double crochet","Simple increases","Mattress-stitch seaming"],
      "patternFormat": "Printed pattern plus a downloadable PDF",
      "customizationOptions": ["Subtle or high-contrast color block","Lined or unlined finish","Short or crossbody strap length"],
      "careInstructions": ["Hand wash cold and lay flat to dry","Steam lightly to even out stitches","Avoid wringing to keep the shape"],
      "availability": "Early Access"
    }'::jsonb
  ) RETURNING id INTO p_crescent;

  INSERT INTO public.product_variants (product_id, sku, variant_name, price_cents, is_active)
  VALUES (p_crescent, 'ECB-DEFAULT', 'Standard', 4200, true)
  RETURNING id INTO v_crescent;

  INSERT INTO public.product_images (product_id, image_url, alt_text, sort_order)
  VALUES
    (p_crescent, '/products/everyday-crescent-bag.png', 'Everyday Crescent Bag crochet bag', 0),
    (p_crescent, '/products/everyday-crescent-bag-detail.png', 'Everyday Crescent Bag detail', 1),
    (p_crescent, '/products/everyday-crescent-bag-styled.png', 'Everyday Crescent Bag styled', 2);

  INSERT INTO public.inventory (variant_id, quantity_on_hand, quantity_reserved, track_inventory)
  VALUES (v_crescent, 50, 0, true);

END $$;
;
