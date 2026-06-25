// Mock data layer for Sproutie Crochet Studio.
// This is intentionally isolated so a real products/materials database
// can replace these exports later without touching the UI.

export type SkillLevel = 'Beginner' | 'Confident Beginner' | 'Intermediate' | 'Advanced'
export type BagType = 'Tote' | 'Shoulder Bag' | 'Crescent Bag' | 'Crossbody'
export type ConstructionMethod =
  | 'Worked in the round'
  | 'Worked flat & seamed'
  | 'Panel & assembly'
  | 'Tapestry crochet'
export type Availability = 'Prototype' | 'Waitlist' | 'Early Access'

export interface Review {
  name: string
  location: string
  rating: number
  date: string
  body: string
}

export interface OriginalKit {
  slug: string
  name: string
  tagline: string
  shortDescription: string
  story: string
  price: number
  image: string
  gallery: string[]
  skillLevel: SkillLevel
  bagType: BagType
  construction: ConstructionMethod
  constructionOverview: string
  makingTime: string
  availability: Availability
  dimensionsIn: string
  dimensionsCm: string
  kitContents: string[]
  toolsNotIncluded: string[]
  techniques: string[]
  patternFormat: string
  customizationOptions: string[]
  careInstructions: string[]
  reviews: Review[]
  featured: boolean
}

export const originalKits: OriginalKit[] = [
  {
    slug: 'aquarium-window-bag',
    name: 'Aquarium Window Bag',
    tagline: 'A clear little window into a tiny stitched sea.',
    shortDescription:
      'A structured tote with a clear vinyl panel framed by tapestry-crochet waves and drifting fish.',
    story:
      'The Aquarium Window Bag started as a doodle of a tide pool seen through fogged glass. We wanted a bag that felt like peeking into a small, calm world, so we framed a clear vinyl panel with tapestry-crochet waves in cool greens and watery blues. The body is worked firmly to hold its shape, and the window is reinforced so it can carry a paperback or a small plant without sagging.',
    price: 68,
    image: '/products/aquarium-window-bag.png',
    gallery: [
      '/products/aquarium-window-bag.png',
      '/products/aquarium-window-bag-detail.png',
      '/products/aquarium-window-bag-styled.png',
    ],
    skillLevel: 'Intermediate',
    bagType: 'Tote',
    construction: 'Tapestry crochet',
    constructionOverview:
      'The front and back panels are worked flat in tapestry crochet, the vinyl window is sewn into a crocheted frame, and the gusset and base are added before the lining is hand-stitched in.',
    makingTime: '18–24 hours',
    availability: 'Waitlist',
    dimensionsIn: '13 in W × 12 in H × 4 in D',
    dimensionsCm: '(33 cm × 30 cm × 10 cm)',
    kitContents: [
      '3 colors of worsted-weight cotton-blend yarn',
      'Pre-cut clear vinyl window panel',
      'Cotton lining fabric, pre-cut',
      'Two pre-punched faux-leather handles',
      'Magnetic snap closure',
      'Printed stitch chart and step-by-step photo guide',
    ],
    toolsNotIncluded: [
      '4.0 mm (G) crochet hook',
      'Yarn needle',
      'Stitch markers',
      'Fabric scissors',
    ],
    techniques: [
      'Single crochet',
      'Tapestry crochet color changes',
      'Working into a chain edge',
      'Whip-stitch seaming',
    ],
    patternFormat: 'Printed booklet plus a downloadable PDF with photo tutorials',
    customizationOptions: [
      'Swap the wave colorway for a sunset palette',
      'Choose black or cognac faux-leather handles',
      'Add an interior key loop',
    ],
    careInstructions: [
      'Spot clean the crochet with a damp cloth and mild soap',
      'Wipe the vinyl window with a soft, dry cloth',
      'Lay flat to dry, away from direct heat',
    ],
    reviews: [
      {
        name: 'Maren K.',
        location: 'Portland, OR',
        rating: 5,
        date: 'Prototype tester',
        body: 'The window detail gets a comment every single time I carry it. The tapestry section was a fun stretch for me as an intermediate maker.',
      },
      {
        name: 'Dani R.',
        location: 'Austin, TX',
        rating: 4,
        date: 'Prototype tester',
        body: 'Loved the structure. I took my time on the color changes and the photo guide made it manageable.',
      },
    ],
    featured: true,
  },
  {
    slug: 'shell-shoulder-bag',
    name: 'Shell Shoulder Bag',
    tagline: 'Soft scalloped texture that sits close at the hip.',
    shortDescription:
      'A rounded shoulder bag built from overlapping shell stitches in a warm, muted palette.',
    story:
      'We kept coming back to the rhythm of the shell stitch — the way it ripples like sand after a wave pulls back. The Shell Shoulder Bag leans into that texture with a gentle scalloped surface and a slouchy, lived-in shape. A removable strap lets it move from a relaxed shoulder bag to a shorter underarm carry.',
    price: 54,
    image: '/products/shell-shoulder-bag.png',
    gallery: [
      '/products/shell-shoulder-bag.png',
      '/products/shell-shoulder-bag-detail.png',
      '/products/shell-shoulder-bag-styled.png',
    ],
    skillLevel: 'Confident Beginner',
    bagType: 'Shoulder Bag',
    construction: 'Worked in the round',
    constructionOverview:
      'The body is worked in continuous rounds of shell stitch, shaped with a flat oval base, then finished with a folded crochet strap and a fabric lining.',
    makingTime: '12–16 hours',
    availability: 'Early Access',
    dimensionsIn: '11 in W × 9 in H × 3 in D',
    dimensionsCm: '(28 cm × 23 cm × 8 cm)',
    kitContents: [
      '2 colors of DK-weight cotton yarn',
      'Cotton lining fabric, pre-cut',
      'Removable adjustable crochet strap pattern',
      'Magnetic snap closure',
      'Printed stitch chart and written pattern',
    ],
    toolsNotIncluded: [
      '3.5 mm (E) crochet hook',
      'Yarn needle',
      'Stitch markers',
    ],
    techniques: [
      'Single crochet',
      'Shell stitch',
      'Working in continuous rounds',
      'Oval base shaping',
    ],
    patternFormat: 'Printed booklet plus a downloadable PDF',
    customizationOptions: [
      'Two-tone or single-color shell pattern',
      'Short underarm strap or long shoulder strap',
      'Add an exterior slip pocket',
    ],
    careInstructions: [
      'Hand wash cold with mild detergent',
      'Reshape while damp and lay flat to dry',
      'Store stuffed lightly to keep its shape',
    ],
    reviews: [
      {
        name: 'Priya S.',
        location: 'Toronto, ON',
        rating: 5,
        date: 'Prototype tester',
        body: 'The shell stitch is so satisfying and the bag feels squishy but holds together. Great confidence-builder.',
      },
      {
        name: 'Lou M.',
        location: 'Chicago, IL',
        rating: 5,
        date: 'Prototype tester',
        body: 'I made the short strap version and use it constantly. The lining instructions were clear.',
      },
    ],
    featured: true,
  },
  {
    slug: 'everyday-crescent-bag',
    name: 'Everyday Crescent Bag',
    tagline: 'The easy, go-anywhere crescent for daily carry.',
    shortDescription:
      'A simple half-moon crescent bag in a calm two-color palette — a relaxed first project.',
    story:
      'Sometimes you just want a bag that goes with everything and works up fast. The Everyday Crescent Bag is our most approachable kit: a clean half-moon shape, a single repeating stitch, and a soft color-block detail you can make subtle or bold. It is the one we reach for on quiet mornings.',
    price: 42,
    image: '/products/everyday-crescent-bag.png',
    gallery: [
      '/products/everyday-crescent-bag.png',
      '/products/everyday-crescent-bag-detail.png',
      '/products/everyday-crescent-bag-styled.png',
    ],
    skillLevel: 'Beginner',
    bagType: 'Crescent Bag',
    construction: 'Worked flat & seamed',
    constructionOverview:
      'The crescent is worked flat in rows with simple increases, folded and seamed up the sides, then finished with a crochet strap and an optional lining.',
    makingTime: '8–12 hours',
    availability: 'Early Access',
    dimensionsIn: '12 in W × 7 in H × 2 in D',
    dimensionsCm: '(30 cm × 18 cm × 5 cm)',
    kitContents: [
      '2 colors of worsted-weight cotton-blend yarn',
      'Crochet strap pattern',
      'Optional cotton lining fabric, pre-cut',
      'Printed written pattern with diagrams',
    ],
    toolsNotIncluded: [
      '4.0 mm (G) crochet hook',
      'Yarn needle',
      'Stitch markers',
    ],
    techniques: [
      'Single crochet',
      'Half double crochet',
      'Simple increases',
      'Mattress-stitch seaming',
    ],
    patternFormat: 'Printed pattern plus a downloadable PDF',
    customizationOptions: [
      'Subtle or high-contrast color block',
      'Lined or unlined finish',
      'Short or crossbody strap length',
    ],
    careInstructions: [
      'Hand wash cold and lay flat to dry',
      'Steam lightly to even out stitches',
      'Avoid wringing to keep the shape',
    ],
    reviews: [
      {
        name: 'Hannah W.',
        location: 'Denver, CO',
        rating: 5,
        date: 'Prototype tester',
        body: 'My first ever crochet bag and it actually looks good. The diagrams were beginner-friendly.',
      },
      {
        name: 'Theo B.',
        location: 'Seattle, WA',
        rating: 4,
        date: 'Prototype tester',
        body: 'Quick and relaxing project. I wish it were a touch bigger, but the crossbody strap option helped.',
      },
    ],
    featured: true,
  },
]

export function getKitBySlug(slug: string): OriginalKit | undefined {
  return originalKits.find((kit) => kit.slug === slug)
}

export function getFeaturedKits(): OriginalKit[] {
  return originalKits.filter((kit) => kit.featured)
}

export const skillLevels: SkillLevel[] = [
  'Beginner',
  'Confident Beginner',
  'Intermediate',
  'Advanced',
]

export const bagTypes: BagType[] = ['Tote', 'Shoulder Bag', 'Crescent Bag', 'Crossbody']

export const constructionMethods: ConstructionMethod[] = [
  'Worked in the round',
  'Worked flat & seamed',
  'Panel & assembly',
  'Tapestry crochet',
]

export const makingTimeBuckets = [
  'Under 12 hours',
  '12–18 hours',
  'Over 18 hours',
] as const
