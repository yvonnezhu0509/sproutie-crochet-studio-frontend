import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Answers to common questions about Sproutie House crochet kits, the Design Studio, availability, accounts, and shipping.',
}

const faqGroups: { category: string; items: { question: string; answer: string }[] }[] = [
  {
    category: 'Kits & Products',
    items: [
      {
        question: 'What does Sproutie House sell?',
        answer:
          'Sproutie House focuses on crochet kits rather than finished products. Each kit is intended to include the materials, accessories, and instructions needed to make the project.',
      },
      {
        question: 'Are the kits beginner-friendly?',
        answer:
          'Difficulty varies by design. Each product page should clearly display the difficulty level, estimated making time, and major techniques before purchase.',
      },
      {
        question: 'Are products available to purchase now?',
        answer:
          'Some products may currently be marked as Early Access, Prototype, or Waitlist. Each product page should clearly display its current availability status.',
      },
    ],
  },
  {
    category: 'The Design Studio',
    items: [
      {
        question: 'What is the Design Studio?',
        answer:
          'The Design Studio is an experimental tool that turns a user\'s inspiration, color preferences, and bag requirements into an AI-assisted design concept.',
      },
      {
        question: 'Does the AI generate a complete crochet pattern?',
        answer:
          'Not yet. AI output should be treated as a concept draft. Stitch counts, construction methods, materials, sizing, and structural feasibility require human review.',
      },
      {
        question: 'Can I order a custom kit from an AI-generated design?',
        answer:
          'A custom kit can only be offered after the design has been reviewed for feasibility, material availability, cost, and difficulty.',
      },
    ],
  },
  {
    category: 'Accounts & Access',
    items: [
      {
        question: 'Do I need an account?',
        answer:
          'Browsing does not require an account. An account may be required to save designs, manage projects, join certain waitlists, or view orders.',
      },
    ],
  },
  {
    category: 'Shipping & Returns',
    items: [
      {
        question: 'Where does Sproutie House ship?',
        answer:
          'Shipping regions and costs will be shown during checkout once paid ordering is available.',
      },
      {
        question: 'Can I return a kit?',
        answer:
          'A detailed return policy will be published before paid ordering launches. Please check back closer to when kits become available for purchase.',
      },
    ],
  },
  {
    category: 'Contact',
    items: [
      {
        question: 'How can I contact Sproutie House?',
        answer:
          'You can reach the studio using the contact details on the site, or by using the Ask Sproutie chat if you have a quick question.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
      {/* Page header */}
      <PageHeader
        eyebrow="FAQ"
        title="Common questions."
        description="If something is not answered here, use the Ask Sproutie chat at the bottom of the page."
        className="mb-20"
      />

      {/* FAQ groups */}
      <div className="flex flex-col gap-16">
        {faqGroups.map((group) => (
          <section key={group.category} aria-labelledby={`faq-${group.category.toLowerCase().replace(/\s+/g, '-')}`}>
            <p
              id={`faq-${group.category.toLowerCase().replace(/\s+/g, '-')}`}
              className="mb-6 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground"
            >
              {group.category}
            </p>
            <Accordion>
              {group.items.map((item, i) => (
                <AccordionItem key={i} value={`${group.category}-${i}`}>
                  <AccordionTrigger className="py-4 text-base font-medium text-foreground hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>
    </div>
  )
}
