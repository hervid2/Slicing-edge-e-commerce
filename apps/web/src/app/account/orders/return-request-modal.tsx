'use client';

import { useState } from 'react';
import { X, PackageSearch } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const RETURN_REASONS = [
  'Defective or damaged item',
  'Wrong item received',
  'Item not as described',
  'Changed my mind',
  'Arrived too late',
  'Missing parts or accessories',
  'Other',
] as const;

interface ReturnRequestModalProps {
  orderNumber: string;
  customerEmail: string;
}

type Step = 'form' | 'success';

export function ReturnRequestModal({ orderNumber, customerEmail }: ReturnRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleOpen() {
    setOpen(true);
    setStep('form');
    setReason('');
    setDescription('');
    setError('');
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError('Please select a return reason.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please describe the issue in at least 10 characters.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          email: customerEmail,
          reason,
          description: description.trim(),
        }),
      });

      const data = (await res.json()) as { message?: string };

      if (!res.ok) {
        setError(data.message ?? 'Failed to submit return request. Please try again.');
        return;
      }

      setStep('success');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        aria-label={`Request a return for order ${orderNumber}`}
      >
        <PackageSearch className="h-3.5 w-3.5" aria-hidden />
        Request Return
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative w-full max-w-md rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-4 top-4 rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <X className="h-4 w-4" />
            </button>

            {step === 'success' ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <PackageSearch className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mb-2 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-primary)]">
                  Return Request Submitted
                </h2>
                <p className="mb-6 text-sm text-[var(--color-muted)]">
                  We received your request for order <strong>#{orderNumber}</strong>. Our team
                  will review it and get back to you via email within 1–2 business days.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex h-10 items-center rounded-md bg-[var(--color-accent)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2
                  id="return-dialog-title"
                  className="mb-1 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-primary)]"
                >
                  Request a Return
                </h2>
                <p className="mb-5 text-sm text-[var(--color-muted)]">
                  Order <span className="font-mono font-semibold">#{orderNumber}</span>
                </p>

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                  {/* Reason */}
                  <div>
                    <label
                      htmlFor="return-reason"
                      className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
                    >
                      Reason for return <span aria-hidden>*</span>
                    </label>
                    <select
                      id="return-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    >
                      <option value="">Select a reason…</option>
                      {RETURN_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="return-description"
                      className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
                    >
                      Describe the issue <span aria-hidden>*</span>
                    </label>
                    <textarea
                      id="return-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      minLength={10}
                      maxLength={2000}
                      rows={4}
                      placeholder="Please describe what happened with the item…"
                      className="w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    />
                    <p className="mt-1 text-right text-xs text-[var(--color-muted)]">
                      {description.length}/2000
                    </p>
                  </div>

                  {error && (
                    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 rounded-md border border-[var(--color-border)] py-2 text-sm font-medium text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-md bg-[var(--color-accent)] py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
                    >
                      {loading ? 'Submitting…' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
