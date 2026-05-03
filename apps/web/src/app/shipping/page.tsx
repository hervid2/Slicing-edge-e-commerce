import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shipping & Returns — Slicing Edge',
  description:
    'Learn about our shipping rates, delivery times, and hassle-free returns policy for premium kitchen knives.',
};

const sections = [
  {
    id: 'shipping',
    title: 'Shipping',
    items: [
      {
        heading: 'Rates',
        body: 'We charge a flat rate of $9.99 for standard shipping. Orders over $75 qualify for free shipping — the discount is applied automatically at checkout.',
      },
      {
        heading: 'Delivery time',
        body: 'Most orders ship within 1–2 business days. Standard delivery takes 5–7 business days once dispatched. You will receive a confirmation email with your tracking number as soon as your order ships.',
      },
      {
        heading: 'Tracking',
        body: (
          <>
            You can track your order at any time from the{' '}
            <Link
              href="/orders"
              className="rounded text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              Order Tracking
            </Link>{' '}
            page or from your account's order history.
          </>
        ),
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Exchanges',
    items: [
      {
        heading: 'Return window',
        body: 'We accept returns within 30 days of delivery. Items must be unused, in their original packaging, and in resalable condition.',
      },
      {
        heading: 'How to request a return',
        body: (
          <>
            Log in to your account, go to{' '}
            <Link
              href="/account/orders"
              className="rounded text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              Order History
            </Link>
            , and click <strong>Request Return</strong> next to the delivered order. Select a reason, add a description, and submit. Our team will review your request and respond within 2 business days.
          </>
        ),
      },
      {
        heading: 'Return process',
        body: 'Once your return is approved we will email you a prepaid shipping label. After we receive and inspect the item, a full refund will be issued to your original payment method within 5–10 business days.',
      },
      {
        heading: 'Non-returnable items',
        body: 'Custom-engraved or personalized items cannot be returned unless they arrived damaged or defective.',
      },
    ],
  },
  {
    id: 'damaged',
    title: 'Damaged or Defective Items',
    items: [
      {
        heading: 'What to do',
        body: (
          <>
            If your order arrived damaged or defective, please{' '}
            <Link
              href="/contact"
              className="rounded text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              contact us
            </Link>{' '}
            within 7 days of delivery. Include your order number and photos of the damage so we can resolve the issue as quickly as possible.
          </>
        ),
      },
    ],
  },
];

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-20">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-primary)] sm:text-5xl">
        Shipping &amp; Returns
      </h1>
      <p className="mt-4 text-lg text-[var(--color-muted)]">
        Everything you need to know about how we ship your order and how to
        return it if something isn&apos;t right.
      </p>

      <div className="mt-12 space-y-12">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`section-${section.id}`}>
            <h2
              id={`section-${section.id}`}
              className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-primary)]"
            >
              {section.title}
            </h2>

            <dl className="mt-6 space-y-6">
              {section.items.map((item) => (
                <div
                  key={item.heading}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4"
                >
                  <dt className="font-semibold text-[var(--color-foreground)]">
                    {item.heading}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                    {item.body}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <p className="mt-14 text-sm text-[var(--color-muted)]">
        Still have questions?{' '}
        <Link
          href="/contact"
          className="rounded text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          Contact our support team
        </Link>{' '}
        or check our{' '}
        <Link
          href="/faq"
          className="rounded text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          FAQ
        </Link>
        .
      </p>
    </div>
  );
}
