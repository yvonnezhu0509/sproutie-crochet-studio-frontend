// Mock options for the AI Tote Design Lab.
// Isolated so a real AI service + materials database can replace these later.

export const inspirationChips = [
  'Coastal morning',
  'Vintage garden',
  'Rainy forest',
  'Fresh fruit market',
  'Soft geometric color blocks',
] as const

export interface ToteSize {
  id: string
  name: string
  dimensions: string
  description: string
  capacity: string
}

export const toteSizes: ToteSize[] = [
  {
    id: 'everyday',
    name: 'Everyday',
    dimensions: '12 in W × 13 in H × 4 in D (30 × 33 × 10 cm)',
    description: 'A balanced daily tote for essentials and a small extra.',
    capacity: 'Holds a small bundle: wallet, water bottle, a book.',
  },
  {
    id: 'work-laptop',
    name: 'Work & Laptop',
    dimensions: '14 in W × 14 in H × 5 in D (36 × 36 × 13 cm)',
    description: 'A firmer, taller build with room for a laptop sleeve.',
    capacity: 'Fits most 14–15 in laptops, a notebook, and daily items.',
  },
  {
    id: 'extra-roomy',
    name: 'Extra Roomy',
    dimensions: '16 in W × 15 in H × 6 in D (41 × 38 × 15 cm)',
    description: 'A generous, slouch-friendly tote for bigger hauls.',
    capacity: 'Great for groceries, yarn projects, or a beach day.',
  },
]

export const carryOptions = [
  { id: 'laptop', label: 'Laptop' },
  { id: 'books', label: 'Books' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'yarn-projects', label: 'Yarn projects' },
  { id: 'everyday-essentials', label: 'Everyday essentials' },
] as const

export interface YarnOption {
  id: string
  name: string
  material: string
  texture: string
  structure: 'Soft & drapey' | 'Medium structure' | 'Firm & structured'
  colors: { name: string; hex: string }[]
  estimatedQuantity: string
  suitability: string
}

export const yarnOptions: YarnOption[] = [
  {
    id: 'meadowspun',
    name: 'Meadowspun Cotton',
    material: '100% mercerized cotton, worsted weight',
    texture: 'Smooth with a soft sheen',
    structure: 'Firm & structured',
    colors: [
      { name: 'Moss', hex: '#6b7a52' },
      { name: 'Fern', hex: '#8a9a6b' },
      { name: 'Warm Cocoa', hex: '#6f5844' },
      { name: 'Cream', hex: '#efe6d2' },
      { name: 'Still Water', hex: '#9bb8c4' },
      { name: 'Soft Coral', hex: '#d99175' },
    ],
    estimatedQuantity: 'Approx. 700–850 yds for an Extra Roomy tote',
    suitability: 'Holds crisp stitch definition and keeps a roomy tote standing tall.',
  },
  {
    id: 'driftwool',
    name: 'Driftwool Blend',
    material: '70% wool / 30% cotton, aran weight',
    texture: 'Lightly heathered and matte',
    structure: 'Medium structure',
    colors: [
      { name: 'Pine Shadow', hex: '#4f5d44' },
      { name: 'Oat', hex: '#d8cbb0' },
      { name: 'Bark', hex: '#5a4738' },
      { name: 'Sage Mist', hex: '#a7b394' },
      { name: 'Tide', hex: '#7fa0ab' },
    ],
    estimatedQuantity: 'Approx. 600–750 yds for an Extra Roomy tote',
    suitability: 'A warmer, cozier hand with enough body for a structured everyday tote.',
  },
  {
    id: 'rivercord',
    name: 'Rivercord Macramé',
    material: '100% recycled cotton cord, bulky weight',
    texture: 'Chunky, rope-like, and matte',
    structure: 'Firm & structured',
    colors: [
      { name: 'Forest', hex: '#3f4d39' },
      { name: 'Clay', hex: '#b07a5e' },
      { name: 'Natural', hex: '#e4d8bf' },
      { name: 'Slate Blue', hex: '#6f8a98' },
    ],
    estimatedQuantity: 'Approx. 400–520 yds for an Extra Roomy tote',
    suitability: 'Makes a sturdy, sculptural tote that works up quickly.',
  },
]

export interface HandleOption {
  id: string
  name: string
  description: string
  // sizes (by tote id) this handle is not recommended for, with a reason
  incompatibleSizes?: string[]
  reason?: string
}

export const handleOptions: HandleOption[] = [
  {
    id: 'crocheted-straps',
    name: 'Crocheted shoulder straps',
    description: 'Matching crocheted straps worked right into the body for a seamless look.',
  },
  {
    id: 'faux-leather',
    name: 'Pre-punched faux leather handles',
    description: 'Sturdy faux-leather handles with pre-punched holes for easy attaching.',
  },
  {
    id: 'wooden',
    name: 'Wooden handles',
    description: 'Rounded wooden handles for a structured, editorial finish.',
    incompatibleSizes: ['extra-roomy'],
    reason:
      'Fixed wooden handles are not recommended for the Extra Roomy tote — the wide, heavier opening puts strain on a rigid handle.',
  },
  {
    id: 'removable-strap',
    name: 'Removable shoulder strap',
    description: 'An adjustable, clip-on strap you can take off for handheld carry.',
  },
]

export interface DetailOption {
  id: string
  name: string
  description: string
  requiresStructured?: boolean
  reason?: string
}

export const detailOptions: DetailOption[] = [
  {
    id: 'magnetic-closure',
    name: 'Magnetic closure',
    description: 'A hidden magnetic snap to keep the top gently closed.',
  },
  {
    id: 'base-insert',
    name: 'Removable base insert',
    description: 'A firm, removable panel that helps the tote stand on its own.',
    requiresStructured: true,
    reason:
      'A base insert needs a firm yarn. It is disabled for soft, drapey yarns because the base would not hold its shape.',
  },
  {
    id: 'key-loop',
    name: 'Interior key loop',
    description: 'A small interior loop so your keys are always within reach.',
  },
  {
    id: 'exterior-pocket',
    name: 'Exterior pocket',
    description: 'A flat exterior pocket for a phone or transit card.',
  },
  {
    id: 'color-block',
    name: 'Simple color-block panel',
    description: 'A clean color-block section using your secondary or accent color.',
  },
]

// Mock difficulty / time / construction estimates by size.
export const sizeEstimates: Record<
  string,
  { difficulty: string; makingTime: string; construction: string }
> = {
  everyday: {
    difficulty: 'Confident Beginner',
    makingTime: '12–16 hours',
    construction: 'Worked in the round from an oval base, then a folded top edge.',
  },
  'work-laptop': {
    difficulty: 'Intermediate',
    makingTime: '16–22 hours',
    construction:
      'Worked flat in firm panels and seamed, with a reinforced base and structured sides.',
  },
  'extra-roomy': {
    difficulty: 'Intermediate',
    makingTime: '20–28 hours',
    construction:
      'Worked in the round with a wide reinforced base and a folded, stabilized top edge.',
  },
}

// Playful but calm generated design names (mock).
export const designNameParts = {
  first: ['Quiet', 'Drifting', 'Soft', 'Folded', 'Morning', 'Tidewater', 'Understory'],
  second: ['Meadow', 'Harbor', 'Canopy', 'Orchard', 'Thicket', 'Marsh', 'Hollow'],
}
