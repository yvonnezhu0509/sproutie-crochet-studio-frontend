// Shared editorial copy and reference content.

export const navLinks = [
  { href: '/design', label: 'Design Your Tote' },
  { href: '/originals', label: 'Studio Originals' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
] as const

export const processSteps = [
  {
    title: 'Share Your Inspiration',
    description:
      'Describe a mood, a place, or a color story — or add a reference image. We read it for mood, color, and function, not to copy an existing product.',
  },
  {
    title: 'Choose Size and Function',
    description:
      'Pick from a few carefully constrained tote sizes and tell us what it needs to carry, from a laptop to a yarn project.',
  },
  {
    title: 'Explore Materials and Details',
    description:
      'Browse compatible yarns, handles, and hardware. We flag combinations that would not hold up structurally and explain why.',
  },
  {
    title: 'Receive a Draft Pattern and Materials List',
    description:
      'Get a concept summary, an estimated materials list, and a draft construction plan. Every draft is reviewed for feasibility before a custom kit is offered.',
  },
] as const

export const whySproutie = [
  {
    title: 'Original design',
    description:
      'Every kit and concept starts as an original idea from the studio, not a re-skin of a generic pattern.',
  },
  {
    title: 'Thoughtful construction',
    description:
      'We test for shape, strength, and how a bag actually behaves when you carry it day to day.',
  },
  {
    title: 'Fewer frustrating assembly steps',
    description:
      'We streamline finishing and seaming so more of your time goes into the satisfying part.',
  },
  {
    title: 'Materials selected to work together',
    description:
      'Yarns, handles, and hardware are chosen as compatible sets, so your pieces actually fit.',
  },
  {
    title: 'Human-reviewed custom kit requests',
    description:
      'A real person reviews each custom request for feasibility before we offer a materials kit.',
  },
] as const

export interface FaqItem {
  question: string
  answer: string
}

export const faqGroups: { category: string; items: FaqItem[] }[] = [
  {
    category: 'The AI Tote Design Lab',
    items: [
      {
        question: 'What does the AI Tote Design Lab actually do right now?',
        answer:
          'In this early prototype, the Design Lab is a guided demo. It walks you through inspiration, size, yarn, handles, and details, then assembles a mock concept summary, a draft construction plan, and an estimated materials list. It does not yet generate a real, tested crochet pattern.',
      },
      {
        question: 'Can the AI recreate an exact pattern from a photo?',
        answer:
          'No. We use inspiration images to understand mood, color, and composition — not to reproduce a specific product or copy someone else’s design. Any pattern you receive is a draft starting point, not a reconstruction.',
      },
      {
        question: 'Are the generated patterns guaranteed to work?',
        answer:
          'No design is guaranteed to work straight out of the lab. Every draft pattern is reviewed by a real person for construction feasibility before we offer a custom materials kit.',
      },
      {
        question: 'Why can I only design a large tote bag?',
        answer:
          'Focusing on one well-understood product — a large-capacity tote — lets us keep the materials and construction realistic during the prototype phase. More categories may follow as the studio grows.',
      },
    ],
  },
  {
    category: 'Kits & Materials',
    items: [
      {
        question: 'Can I buy a kit today?',
        answer:
          'Not yet. Studio Originals are in a prototype and early-access phase. You can join the waitlist or request early access, and we will reach out as kits become available.',
      },
      {
        question: 'What comes in a materials kit?',
        answer:
          'Kits are designed to include the yarn, hardware, handles, lining, and a printed pattern needed for a project. Basic tools like hooks and yarn needles are listed but not included. Exact contents are shown on each kit page.',
      },
      {
        question: 'Is the pricing final?',
        answer:
          'All prices shown are placeholder estimates in US dollars while we prototype. Final pricing will be confirmed before any kit is offered for purchase.',
      },
    ],
  },
  {
    category: 'Skill & Support',
    items: [
      {
        question: 'I am a beginner. Can I still make these?',
        answer:
          'Yes. Each kit lists a skill level, and we have approachable options like the Everyday Crescent Bag. Patterns use standard US crochet terms and include diagrams or photo guides.',
      },
      {
        question: 'What crochet terminology do you use?',
        answer:
          'We use US crochet terminology throughout — for example, “single crochet” rather than the UK equivalent. Hook sizes are given in millimeters and measurements are shown in inches first, with centimeters in parentheses.',
      },
    ],
  },
]
