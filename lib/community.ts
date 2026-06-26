// Mock community data — all frontend only, no backend.

export type ProjectStatus = 'concept' | 'wip' | 'finished'
export type ProjectCategory =
  | 'all'
  | 'concepts'
  | 'wip'
  | 'finished'
  | 'studio-originals'
  | 'ai-assisted'

export interface CommunityComment {
  id: string
  author: string
  avatar: string // initials fallback
  date: string
  body: string
}

export interface CommunityProject {
  id: string
  title: string
  creator: string
  creatorInitials: string
  status: ProjectStatus
  category: ProjectCategory[]
  bagType: string
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
  colorPalette: string[]
  constructionMethod: string
  shortCaption: string
  description: string
  inspiration: string
  materials: string[]
  dimensions: string
  constructionNotes: string
  difficulty: string
  creatorNotes: string
  image: string
  images: string[]
  likes: number
  comments: CommunityComment[]
  featured: boolean
  aiAssisted: boolean
}

export const communityProjects: CommunityProject[] = [
  {
    id: 'frutiger-aero-shoulder',
    title: 'Frutiger Aero Shoulder Bag',
    creator: 'mira.loops',
    creatorInitials: 'ML',
    status: 'finished',
    category: ['finished', 'ai-assisted'],
    bagType: 'Shoulder Bag',
    skillLevel: 'advanced',
    colorPalette: ['aqua', 'sky blue', 'iridescent', 'chrome'],
    constructionMethod: 'Tapestry crochet with vinyl insets',
    shortCaption:
      'Translucent panels and glossy aqua yarn — a bag that feels like early internet optimism.',
    description:
      'I started this project after finding an old CD-ROM that came with a magazine in 2003. The reflective, watery aesthetic of that era felt completely aligned with what crochet can do with the right materials. The clear vinyl panels are sewn into the crochet structure after finishing.',
    inspiration:
      'Frutiger Aero design language, early 2000s UI aesthetics, and the translucent plastic of old electronics.',
    materials: [
      'Paintbox Cotton DK in "Kingfisher Blue" and "Aqua"',
      'Clear PVC vinyl panel, 0.2mm',
      'Chrome lobster clasp and D-rings',
      'Iridescent thread accent',
    ],
    dimensions: '11" wide × 9" tall × 3" deep (28 × 23 × 8 cm)',
    constructionNotes:
      'The body is worked flat in tapestry crochet, seamed at the sides. The vinyl panels are cut to shape and attached with a whip stitch through pre-punched holes. The chrome hardware is riveted, not sewn.',
    difficulty: 'Advanced — requires tapestry crochet, vinyl panel work, and hardware installation.',
    creatorNotes:
      'The trickiest part was keeping the tapestry tension even while introducing the vinyl. I recommend basting the vinyl loosely before committing to the final attachment.',
    image: '/community/frutiger-aero-shoulder.png',
    images: ['/community/frutiger-aero-shoulder.png'],
    likes: 142,
    comments: [
      {
        id: 'c1',
        author: 'driftknit',
        avatar: 'DK',
        date: 'June 12, 2025',
        body: 'The color combination is extraordinary — aqua and iridescent together gives it that depth you usually only see in digital renders. How does the vinyl hold up with regular use?',
      },
      {
        id: 'c2',
        author: 'yarnfield',
        avatar: 'YF',
        date: 'June 14, 2025',
        body: 'The proportions are really well considered. Did you try the Kingfisher at a tighter gauge first? I imagine the structure could get floppy with a looser tension.',
      },
      {
        id: 'c3',
        author: 'mira.loops',
        avatar: 'ML',
        date: 'June 15, 2025',
        body: 'The vinyl has held up well through about three months of regular use — no cracking at the edges. I used a 2.5mm hook which is tighter than the yarn recommends, which keeps the walls firm.',
      },
    ],
    featured: true,
    aiAssisted: true,
  },
  {
    id: 'childhood-memory-bag',
    title: 'Something from Childhood',
    creator: 'softstitch.co',
    creatorInitials: 'SC',
    status: 'finished',
    category: ['finished'],
    bagType: 'Mini Bag',
    skillLevel: 'intermediate',
    colorPalette: ['dusty pink', 'powder blue', 'ecru'],
    constructionMethod: 'Shell stitch with embroidered details',
    shortCaption:
      'A bag assembled from color memory — the specific pinks and blues of a childhood bedroom.',
    description:
      'This started as an exercise in trying to recreate a specific emotional memory through material — the particular dusty pink of a wallpaper border and the powder blue of a ceramic piggy bank. The scale is deliberately small, almost precious.',
    inspiration:
      'Childhood bedroom colors remembered imprecisely. A photograph found in a drawer.',
    materials: [
      'Rowan Cotton Glace in "Candy Floss" and "Pier"',
      'DMC stranded cotton for embroidery in ecru',
      'Small pearl button closure',
    ],
    dimensions: '7" wide × 6" tall × 1.5" deep (18 × 15 × 4 cm)',
    constructionNotes:
      'Worked in rounds using a 3mm hook. The shell stitch creates a natural scalloped edge at the top. Embroidery is added after blocking, while the fabric is still slightly damp for easier needle work.',
    difficulty: 'Intermediate — shell stitch and basic embroidery required.',
    creatorNotes:
      'The colors are harder to match than you might expect. The Candy Floss reads much pinker in person than online. I adjusted by mixing in a very small strand of ecru to soften it.',
    image: '/community/childhood-memory-bag.png',
    images: ['/community/childhood-memory-bag.png'],
    likes: 98,
    comments: [
      {
        id: 'c4',
        author: 'wrencraft',
        avatar: 'WC',
        date: 'May 28, 2025',
        body: 'The concept of reconstructing a memory through color is something I think about a lot. The execution here is careful — it does not feel decorative, it feels intentional.',
      },
      {
        id: 'c5',
        author: 'loop.archive',
        avatar: 'LA',
        date: 'June 1, 2025',
        body: 'Would love to know more about the embroidery technique — are those worked with a tapestry needle or a crewel needle? The stitches look very clean for post-block work.',
      },
    ],
    featured: true,
    aiAssisted: false,
  },
  {
    id: 'structured-everyday-tote',
    title: 'The Slate Tote',
    creator: 'fieldwork.yarn',
    creatorInitials: 'FY',
    status: 'finished',
    category: ['finished', 'studio-originals'],
    bagType: 'Tote Bag',
    skillLevel: 'intermediate',
    colorPalette: ['slate blue', 'dark charcoal', 'dark walnut'],
    constructionMethod: 'Dense single crochet with internal structure',
    shortCaption:
      'A tote that holds its shape empty. Slate-blue cotton, single-crochet density, and walnut handles.',
    description:
      'I wanted a tote that did not collapse when you put it down — something that stands up on its own and looks considered even when empty. This is made from the Aquarium Window Bag kit base but without the vinyl panel, substituting a custom slate-blue colorway.',
    inspiration: 'Architectural bags from contemporary leather goods brands. The shape of a folded architect\'s portfolio.',
    materials: [
      'Paintbox Cotton Aran in "Slate Blue" (main)',
      'Paintbox Cotton Aran in "Dark Charcoal" (base)',
      'Dark walnut wooden handles, 50cm',
      'Light interfacing for internal structure',
    ],
    dimensions: '14" wide × 12" tall × 4" deep (36 × 30 × 10 cm)',
    constructionNotes:
      'Worked flat in single crochet at a significantly tighter gauge than recommended to achieve a dense, self-supporting fabric. Internal interfacing is sewn to the lining, not to the crochet body.',
    difficulty: 'Intermediate — requires careful gauge maintenance and lining installation.',
    creatorNotes:
      'Going down two hook sizes gave the fabric the stiffness I was after without needing a stiffening spray. The walnut handles were sourced from a small hardware supplier — the 50cm width is important for the proportions.',
    image: '/community/structured-everyday-tote.png',
    images: ['/community/structured-everyday-tote.png'],
    likes: 211,
    comments: [
      {
        id: 'c6',
        author: 'mira.loops',
        avatar: 'ML',
        date: 'June 3, 2025',
        body: 'The self-supporting structure is something I have been working toward for months. Going down two hook sizes is such a clean solution — did you find it slowed down the work significantly?',
      },
      {
        id: 'c7',
        author: 'softstitch.co',
        avatar: 'SC',
        date: 'June 4, 2025',
        body: 'The walnut handles are doing a lot of work here. The proportion of handle to bag height looks exactly right. Would a shorter handle read differently?',
      },
      {
        id: 'c8',
        author: 'fieldwork.yarn',
        avatar: 'FY',
        date: 'June 6, 2025',
        body: 'Yes, the tighter gauge added about 30% more time but the result justifies it. I tried 40cm handles in a prototype and it made the bag look squat — the 50cm length gives it a more elegant silhouette.',
      },
    ],
    featured: true,
    aiAssisted: false,
  },
  {
    id: 'aquatic-window-bag',
    title: 'Tidal Window Bag',
    creator: 'tidemaker',
    creatorInitials: 'TM',
    status: 'wip',
    category: ['wip', 'ai-assisted'],
    bagType: 'Tote Bag',
    skillLevel: 'advanced',
    colorPalette: ['teal', 'aqua', 'clear vinyl', 'cognac'],
    constructionMethod: 'Tapestry crochet with vinyl window',
    shortCaption:
      'Tapestry waves framing a clear window — a variation on the studio\'s Aquarium kit.',
    description:
      'A riff on the studio Aquarium Window Bag concept, pushing the wave motif further and increasing the vinyl panel size. Currently about 70% complete — the handles and final seaming remain.',
    inspiration: 'Tide pools. Looking into a rock pool at low tide and seeing layers.',
    materials: [
      'Scheepjes Catona in "Cyan" and "Powder Blue"',
      'Clear PVC vinyl panel, 0.3mm',
      'Cognac leather handles (sourced separately)',
    ],
    dimensions: 'Target: 13" wide × 11" tall × 3.5" deep',
    constructionNotes:
      'Working the tapestry section in joined rounds. The wave motif uses a four-color sequence which requires careful float management on the wrong side.',
    difficulty: 'Advanced — tapestry crochet with multi-color floats.',
    creatorNotes: 'Float management is the main challenge. I am using a yarn divider to keep the four colors from tangling.',
    image: '/community/aquatic-window-bag.png',
    images: ['/community/aquatic-window-bag.png'],
    likes: 76,
    comments: [
      {
        id: 'c9',
        author: 'driftknit',
        avatar: 'DK',
        date: 'June 18, 2025',
        body: 'The wave gradient across the panel looks beautifully controlled from what I can see. Are you carrying all four colors at once or picking up and dropping?',
      },
      {
        id: 'c10',
        author: 'tidemaker',
        avatar: 'TM',
        date: 'June 19, 2025',
        body: 'Carrying all four — the float length stays manageable because the color changes happen every 3–4 stitches. I lock the floats every second round to keep the inside tidy.',
      },
    ],
    featured: true,
    aiAssisted: true,
  },
  {
    id: 'seasonal-crescent',
    title: 'Late October Crescent',
    creator: 'harvestrow',
    creatorInitials: 'HR',
    status: 'finished',
    category: ['finished'],
    bagType: 'Crescent Bag',
    skillLevel: 'beginner',
    colorPalette: ['ochre', 'burnt sienna', 'warm sand'],
    constructionMethod: 'Half-double crochet worked in rows',
    shortCaption: 'Ochre and burnt sienna in a half-moon shape — a bag that belongs to one specific month.',
    description:
      'I make a new crescent bag every autumn in that year\'s dominant color. This one captures the exact ochre of the leaves on the street outside my studio in late October. It is a fast make — two evenings from start to finish.',
    inspiration: 'The color of a specific ginkgo tree at 4pm in October.',
    materials: [
      'Lion Brand 24/7 Cotton in "Goldenrod" and "Terracotta"',
      'Handmade twisted crochet strap',
      'Small magnetic closure',
    ],
    dimensions: '10" wide × 6" tall at deepest point (25 × 15 cm)',
    constructionNotes: 'Worked flat from the bottom curve upward. The strap is a 4-strand twisted cord, about 110cm finished length.',
    difficulty: 'Beginner-friendly — straightforward rows, no shaping until the curve.',
    creatorNotes: 'The Goldenrod and Terracotta combination from this brand is exceptionally good — the values are close enough that the color-block reads as tonal rather than high contrast.',
    image: '/community/seasonal-crescent.png',
    images: ['/community/seasonal-crescent.png'],
    likes: 134,
    comments: [
      {
        id: 'c11',
        author: 'loop.archive',
        avatar: 'LA',
        date: 'May 20, 2025',
        body: 'The idea of making a seasonal bag from the year\'s dominant color is a beautiful practice. The two-tone is exactly right — any more contrast and it would tip into something more decorative.',
      },
      {
        id: 'c12',
        author: 'wrencraft',
        avatar: 'WC',
        date: 'May 21, 2025',
        body: 'Two evenings is impressive for the quality of the finish. Do you block the curve at the end or is the shaping purely structural from the stitch count?',
      },
    ],
    featured: true,
    aiAssisted: false,
  },
  // Gallery-only entries
  {
    id: 'mesh-bucket-bag',
    title: 'Open Mesh Bucket',
    creator: 'driftknit',
    creatorInitials: 'DK',
    status: 'finished',
    category: ['finished'],
    bagType: 'Bucket Bag',
    skillLevel: 'intermediate',
    colorPalette: ['ivory', 'natural', 'sage lining'],
    constructionMethod: 'Open lace mesh in rounds',
    shortCaption: 'Natural cotton lace mesh with a sage green lining visible through the open stitches.',
    description: 'A bucket bag where the lining is part of the design — a sage green fabric that glows softly through the open mesh.',
    inspiration: 'Light through a window screen. Negative space.',
    materials: ['Paintbox Cotton DK in "Vanilla Cream"', 'Sage green cotton lining fabric', 'Flat leather base'],
    dimensions: '10" diameter × 10" tall (25 × 25 cm)',
    constructionNotes: 'Worked in rounds from the base up. The mesh pattern is a simple chain-space repeat.',
    difficulty: 'Intermediate.',
    creatorNotes: 'Choose a lining with enough color depth to show through — pale linings disappear.',
    image: '/community/gallery-mesh-bucket.png',
    images: ['/community/gallery-mesh-bucket.png'],
    likes: 89,
    comments: [],
    featured: false,
    aiAssisted: false,
  },
  {
    id: 'colorblock-tote',
    title: 'Terracotta Colorblock Tote',
    creator: 'loop.archive',
    creatorInitials: 'LA',
    status: 'concept',
    category: ['concepts', 'ai-assisted'],
    bagType: 'Tote Bag',
    skillLevel: 'intermediate',
    colorPalette: ['terracotta', 'warm sand', 'dusty teal'],
    constructionMethod: 'Flat single crochet colorblock',
    shortCaption: 'Three horizontal color bands — a tote designed around a palette, not a stitch.',
    description: 'Started as a color study. The three bands are sized by visual weight rather than equal thirds.',
    inspiration: 'A tile floor in a mid-century building.',
    materials: ['Lion Brand 24/7 Cotton in three colorways', 'Bamboo handles'],
    dimensions: 'Planned: 13" wide × 11" tall',
    constructionNotes: 'Will work flat with planned color joins at specific row counts.',
    difficulty: 'Intermediate.',
    creatorNotes: 'Still deciding whether the teal band should be at the top or the bottom. Color balance changes significantly.',
    image: '/community/gallery-colorblock-tote.png',
    images: ['/community/gallery-colorblock-tote.png'],
    likes: 54,
    comments: [],
    featured: false,
    aiAssisted: true,
  },
  {
    id: 'granny-square-bag',
    title: 'Muted Granny Patchwork',
    creator: 'yarnfield',
    creatorInitials: 'YF',
    status: 'finished',
    category: ['finished'],
    bagType: 'Shoulder Bag',
    skillLevel: 'intermediate',
    colorPalette: ['dusty mauve', 'sage green', 'ecru'],
    constructionMethod: 'Joined granny squares',
    shortCaption: 'Granny squares in a considered palette — the structure of a traditional technique with a contemporary color sense.',
    description: 'Twenty-four squares, each worked separately and joined as-you-go. The palette is the design.',
    inspiration: 'A Gee\'s Bend quilt. The geometry of repetition.',
    materials: ['Scheepjes Stonewashed in "Pink Quartzite", "Crystal Quartz", and "Boulder Opal"', 'Leather loop handles'],
    dimensions: '12" wide × 10" tall (30 × 25 cm)',
    constructionNotes: 'Squares are joined with a flat slip-stitch join for minimal visible seam.',
    difficulty: 'Intermediate — requires patience with color management across 24 squares.',
    creatorNotes: 'Blocking each square individually before joining is essential — unblocked squares will not lie flat.',
    image: '/community/gallery-granny-square-bag.png',
    images: ['/community/gallery-granny-square-bag.png'],
    likes: 167,
    comments: [],
    featured: false,
    aiAssisted: false,
  },
  {
    id: 'mini-crossbody',
    title: 'Midnight Crossbody',
    creator: 'wrencraft',
    creatorInitials: 'WC',
    status: 'finished',
    category: ['finished'],
    bagType: 'Crossbody Bag',
    skillLevel: 'intermediate',
    colorPalette: ['midnight navy', 'brass'],
    constructionMethod: 'Diamond stitch pattern worked flat',
    shortCaption: 'Deep navy with a diamond texture and brass hardware — small and considered.',
    description: 'A bag designed for exactly one day\'s worth of essentials. The flap closes with a magnetic snap hidden behind a brass ring.',
    inspiration: 'The shape of a folded letter. Something that closes cleanly.',
    materials: ['Paintbox Cotton Aran in "Midnight"', 'Brass D-rings and magnetic snap'],
    dimensions: '8" wide × 6" tall × 2" deep (20 × 15 × 5 cm)',
    constructionNotes: 'Worked flat. The diamond pattern emerges from a front-post and back-post stitch sequence.',
    difficulty: 'Intermediate — requires front-post and back-post crochet.',
    creatorNotes: 'The magnetic snap must be installed before the lining is sewn in — this seems obvious but I learned it the hard way.',
    image: '/community/gallery-mini-crossbody.png',
    images: ['/community/gallery-mini-crossbody.png'],
    likes: 103,
    comments: [],
    featured: false,
    aiAssisted: false,
  },
  {
    id: 'wip-tapestry',
    title: 'Geometric Tapestry — in progress',
    creator: 'driftknit',
    creatorInitials: 'DK',
    status: 'wip',
    category: ['wip'],
    bagType: 'Tote Bag',
    skillLevel: 'advanced',
    colorPalette: ['rust', 'cream'],
    constructionMethod: 'Tapestry crochet geometric pattern',
    shortCaption: 'A tapestry tote mid-construction — the geometry is emerging, the top half still to go.',
    description: 'Sharing this as a work in progress because I am making decisions in real time about the upper section. Would welcome feedback on whether the geometric motif should continue or resolve into a solid band.',
    inspiration: 'Southwestern geometric textile patterns filtered through a contemporary lens.',
    materials: ['Paintbox Cotton Aran in "Russet" and "Champagne"'],
    dimensions: 'Planned: 13" wide × 12" tall',
    constructionNotes: 'Worked in joined rounds. Currently at round 28 of a planned 52.',
    difficulty: 'Advanced — four-color tapestry crochet with long floats.',
    creatorNotes: 'Actively seeking feedback: should the geometric motif extend to the top of the bag, or transition to a solid band for the top 8–10 rows?',
    image: '/community/gallery-wip-tapestry.png',
    images: ['/community/gallery-wip-tapestry.png'],
    likes: 61,
    comments: [],
    featured: false,
    aiAssisted: false,
  },
]

export const featuredProjects = communityProjects.filter((p) => p.featured)

export const FILTER_LABELS: Record<ProjectCategory, string> = {
  all: 'All',
  concepts: 'Concepts',
  wip: 'Works in Progress',
  finished: 'Finished Bags',
  'studio-originals': 'Studio Originals',
  'ai-assisted': 'AI-Assisted',
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  concept: 'Concept',
  wip: 'Work in Progress',
  finished: 'Finished Bag',
}

export const communityGuidelines = [
  'Credit original designers and sources of inspiration.',
  'Do not upload or redistribute paid patterns.',
  'Do not present another maker\'s design as your own.',
  'Keep feedback respectful and useful.',
  'Clearly label AI-assisted concepts and unfinished drafts.',
]
