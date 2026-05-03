'use client';

import { useState } from 'react';

const SUBJECTS = [
  'Order inquiry',
  'Return or exchange',
  'Product question',
  'Shipping & delivery',
  'Warranty claim',
  'Other',
];

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY: FormState = { name: '', email: '', subject: '', message: '' };

export function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Something went wrong. Please try again.');
      }

      setStatus('success');
      setForm(EMPTY);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
          Message sent!
        </h2>
        <p className="text-[var(--color-muted)]">
          Thank you for reaching out. We will get back to you within 1–2 business days.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-2 rounded-md bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          Send another message
        </button>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50';

  const isLoading = status === 'loading';

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
            Full name <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Jane Smith"
            value={form.name}
            onChange={handleChange}
            disabled={isLoading}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
            Email address <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={handleChange}
            disabled={isLoading}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
          Subject <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="contact-subject"
          name="subject"
          required
          value={form.subject}
          onChange={handleChange}
          disabled={isLoading}
          className={inputClass}
        >
          <option value="" disabled>Select a topic…</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
          Message <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          minLength={10}
          placeholder="Tell us how we can help you…"
          value={form.message}
          onChange={handleChange}
          disabled={isLoading}
          className={inputClass}
        />
      </div>

      {status === 'error' && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--color-accent)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50 sm:w-auto"
      >
        {isLoading ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
