import type { Metadata } from 'next';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Have a question about an order, a product, or anything else? Send us a message and we will get back to you within 1–2 business days.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-primary)] sm:text-5xl">
        Contact Us
      </h1>
      <p className="mt-4 text-lg text-[var(--color-muted)]">
        Have a question about an order, a product, or anything else? Fill in the form below and we
        will get back to you within 1–2 business days.
      </p>

      <div className="mt-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
        <ContactForm />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
            label: 'Email',
            value: 'support@slicing-edge.com',
          },
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 119.5 9 2.5 2.5 0 0112 11.5z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
            label: 'Response time',
            value: '1–2 business days',
          },
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
            label: 'Support hours',
            value: 'Mon – Fri, 9 am – 6 pm',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-center"
          >
            <span className="text-[var(--color-accent)]">{item.icon}</span>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {item.label}
            </p>
            <p className="text-sm font-medium text-[var(--color-foreground)]">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
