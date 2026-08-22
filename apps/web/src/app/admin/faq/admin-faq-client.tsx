'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionModal } from '@/components/ui/motion-modal';
import {
  listAdminFaq,
  createFaqEntry,
  updateFaqEntry,
  deleteFaqEntry,
  type FaqEntry,
} from '@/lib/api/admin-faq';

// ── FAQ form (create / edit) ──────────────────────────────────────────────────

interface FaqFormProps {
  initial?: FaqEntry;
  onSaved: (entry: FaqEntry) => void;
  onCancel: () => void;
}

function FaqForm({ initial, onSaved, onCancel }: FaqFormProps) {
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [answer, setAnswer] = useState(initial?.answer ?? '');
  const [position, setPosition] = useState(String(initial?.position ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = { question, answer, position: Number(position), isActive };
      const result = initial
        ? await updateFaqEntry(initial.id, data)
        : await createFaqEntry(data);
      onSaved(result.entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <MotionModal onClose={onCancel} ariaLabelledBy="faq-form-title" className="max-w-lg p-6">
      <h2
        id="faq-form-title"
        className="mb-4 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-primary)]"
      >
        {initial ? 'Edit FAQ Entry' : 'New FAQ Entry'}
      </h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="faq-question" className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
              Question
            </label>
            <input
              id="faq-question"
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label htmlFor="faq-answer" className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
              Answer
            </label>
            <textarea
              id="faq-answer"
              required
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="faq-position" className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                Position
              </label>
              <input
                id="faq-position"
                type="number"
                min={0}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <input
                id="faq-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              <label htmlFor="faq-active" className="text-sm font-medium text-[var(--color-foreground)]">
                Active
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="inline-flex h-10 items-center rounded-md border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-background)] disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center rounded-md bg-[var(--color-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
    </MotionModal>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminFaqClient() {
  const [entries, setEntries] = useState<FaqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<FaqEntry | null | 'new'>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listAdminFaq()
      .then((data) => setEntries(data.entries))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load FAQ'))
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(entry: FaqEntry) {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === entry.id);
      return idx >= 0
        ? prev.map((e) => (e.id === entry.id ? entry : e))
        : [...prev, entry];
    });
    setEditing(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteFaqEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // silently keep entry on failure
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        {!loading && !error && (
          <p className="text-sm text-[var(--color-muted)]">
            {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
          </p>
        )}
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="ml-auto inline-flex h-10 items-center rounded-md bg-[var(--color-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
        >
          + New Entry
        </button>
      </div>

      {loading && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 text-center text-sm text-[var(--color-muted)]">
          Loading FAQ…
        </div>
      )}
      {!loading && error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--color-background)] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Question</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                    No FAQ entries yet. Add the first one.
                  </td>
                </tr>
              )}
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-t border-[var(--color-border)] hover:bg-[var(--color-background)]"
                >
                  <td className="px-4 py-3 text-[var(--color-muted)]">{entry.position}</td>
                  <td className="px-4 py-3 max-w-md">
                    <p className="font-medium text-[var(--color-foreground)]">{entry.question}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-muted)]">{entry.answer}</p>
                  </td>
                  <td className="px-4 py-3">
                    {entry.isActive ? (
                      <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-[var(--color-background)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-muted)] border border-[var(--color-border)]">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(entry)}
                        className="rounded px-2 py-1 text-xs font-medium text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        aria-label={`Delete FAQ entry: ${entry.question}`}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        {deletingId === entry.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {editing !== null && (
          <FaqForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? undefined : editing}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
