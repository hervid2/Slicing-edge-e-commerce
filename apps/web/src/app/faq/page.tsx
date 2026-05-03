import type { Metadata } from 'next';
import { FaqAccordion } from './faq-accordion';

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions',
  description:
    'Find answers to the most common questions about shipping, returns, warranties, and our premium kitchen knives.',
};

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  position: number;
}

interface FaqCategory {
  label: string;
  entries: Omit<FaqEntry, 'position'>[];
}

const DEFAULT_CATEGORIES: FaqCategory[] = [
  {
    label: 'Shipping & Delivery',
    entries: [
      {
        id: 'default-1',
        question: 'What are your shipping options and costs?',
        answer:
          'We offer standard shipping at a flat rate of $9.99. Orders over $75 qualify for free standard shipping. Expedited shipping is available at checkout for an additional fee.',
      },
      {
        id: 'default-2',
        question: 'How long does delivery take?',
        answer:
          'Standard shipping takes 5–7 business days from the date your order ships. You will receive a shipping confirmation email with a tracking number once your order is on its way.',
      },
      {
        id: 'default-3',
        question: 'Can I track my order?',
        answer:
          'Yes. As soon as your order ships, we will send you a confirmation email with a tracking number and carrier name. You can also check your tracking information at any time on our Order Tracking page.',
      },
      {
        id: 'default-4',
        question: 'Do you ship internationally?',
        answer:
          'At this time we only ship within the national territory. We are working to expand our shipping destinations — subscribe to our newsletter to be notified when international shipping becomes available.',
      },
    ],
  },
  {
    label: 'Returns & Warranty',
    entries: [
      {
        id: 'default-5',
        question: 'What is your return policy?',
        answer:
          'We accept returns within 30 days of delivery, provided the item is unused and in its original packaging. To start a return, go to My Account → Order History and click "Request Return" on the relevant order.',
      },
      {
        id: 'default-6',
        question: 'What if my knife arrived damaged?',
        answer:
          'We are sorry to hear that! Please contact us within 7 days of delivery with photos of the damage. We will arrange a replacement or full refund at no extra cost to you.',
      },
      {
        id: 'default-7',
        question: 'Do your knives come with a warranty?',
        answer:
          'All Slicing Edge knives carry a lifetime warranty against manufacturing defects. Normal wear, improper use, or damage caused by dishwashers is not covered. Contact our support team to start a warranty claim.',
      },
    ],
  },
  {
    label: 'Products & Care',
    entries: [
      {
        id: 'default-8',
        question: 'What type of steel are your knives made from?',
        answer:
          'Depending on the model, our knives are crafted from German stainless steel (1.4116), Japanese VG-10 steel, or high-carbon steel. The exact steel type is listed in each product description so you can choose the blade that best suits your cooking style.',
      },
      {
        id: 'default-9',
        question: 'How do I care for and maintain my knife?',
        answer:
          'Always hand-wash and dry your knife immediately after use — dishwashers damage the edge and handle over time. Sharpen regularly with a honing rod or whetstone suited to the steel type, and store on a magnetic strip or in a knife block to protect the blade.',
      },
      {
        id: 'default-10',
        question: "What is the difference between a Chef's Knife and a Santoku?",
        answer:
          "A Chef's Knife (20–25 cm) features a curved blade ideal for the rocking motion used in Western-style chopping. A Santoku (16–18 cm) has a shorter, flatter edge that excels at precision slicing of vegetables, fish, and boneless meats. Both are all-purpose knives — choose based on your grip preference and dominant cutting technique.",
      },
    ],
  },
  {
    label: 'Account & Payment',
    entries: [
      {
        id: 'default-11',
        question: 'What payment methods do you accept?',
        answer:
          'We accept Visa, Mastercard, American Express, and debit cards through our secure Stripe Checkout. We do not store your card details on our servers.',
      },
      {
        id: 'default-12',
        question: 'Can I place an order without creating an account?',
        answer:
          'Absolutely. You can check out as a guest using only your email address. Your order confirmation and tracking information will be sent to that email. Creating an account unlocks order history, wishlist, and a faster checkout experience for future visits.',
      },
      {
        id: 'default-13',
        question: 'How do I change or cancel my order?',
        answer:
          'Orders can be modified or cancelled within 2 hours of being placed, before they enter our fulfillment process. Contact our support team as soon as possible. If the order has already shipped, you will need to initiate a return once the package arrives.',
      },
    ],
  },
];

async function getPublicFaqs(): Promise<FaqEntry[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/faq`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { entries?: FaqEntry[] };
    return data.entries ?? [];
  } catch {
    return [];
  }
}

export default async function FaqPage() {
  const apiEntries = await getPublicFaqs();
  const hasApiEntries = apiEntries.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-20">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-primary)] sm:text-5xl">
        Frequently Asked Questions
      </h1>
      <p className="mt-4 text-lg text-[var(--color-muted)]">
        Everything you need to know about our knives, orders, and policies. Can&apos;t find what you&apos;re
        looking for?{' '}
        <a
          href="/contact"
          className="text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
        >
          Contact us
        </a>
        .
      </p>

      <div className="mt-12">
        {hasApiEntries ? (
          <FaqAccordion entries={apiEntries} />
        ) : (
          DEFAULT_CATEGORIES.map((category) => (
            <section key={category.label} className="mb-10">
              <h2 className="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
                {category.label}
              </h2>
              <FaqAccordion entries={category.entries.map((e, i) => ({ ...e, position: i }))} />
            </section>
          ))
        )}
      </div>
    </div>
  );
}
