'use client';

import { useEffect, useState } from 'react';
import {
  listAdminReturns,
  updateReturnStatus,
  type ReturnRequest,
  type ReturnStatus,
} from '@/lib/api/admin-returns';

const STATUS_COLORS: Record<ReturnStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
};

const ALL_STATUSES: ReturnStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'REFUNDED'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Status update row ─────────────────────────────────────────────────────────

interface StatusSelectProps {
  item: ReturnRequest;
  onUpdated: (id: string, status: ReturnStatus, note?: string) => void;
}

function StatusSelect({ item, onUpdated }: StatusSelectProps) {
  const [value, setValue] = useState<ReturnStatus>(item.status);
  const [note, setNote] = useState(item.adminNote ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setLoading(true);
    try {
      await updateReturnStatus(item.id, value, note || undefined);
      onUpdated(item.id, value, note || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  const dirty = value !== item.status || note !== (item.adminNote ?? '');

  return (
    <div className="flex flex-col gap-1.5">
      <select
        value={value}
        disabled={loading}
        onChange={(e) => setValue(e.target.value as ReturnStatus)}
        aria-label={`Change status for return ${item.id}`}
        className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Admin note (optional)"
        disabled={loading}
        className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
      />
      {dirty && (
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={loading}
          className="inline-flex h-7 items-center justify-center rounded bg-[var(--color-accent)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Detail expandable row ─────────────────────────────────────────────────────

function ExpandedRow({ item }: { item: ReturnRequest }) {
  return (
    <tr className="bg-[var(--color-background)]">
      <td colSpan={6} className="px-6 py-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="font-semibold text-[var(--color-foreground)]">Reason</p>
            <p className="mt-1 text-[var(--color-muted)]">{item.reason}</p>
          </div>
          <div>
            <p className="font-semibold text-[var(--color-foreground)]">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-[var(--color-muted)]">{item.description}</p>
          </div>
          {item.adminNote && (
            <div>
              <p className="font-semibold text-[var(--color-foreground)]">Admin Note</p>
              <p className="mt-1 text-[var(--color-muted)]">{item.adminNote}</p>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminReturnsClient() {
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | ''>('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    listAdminReturns(page, 20, statusFilter || undefined)
      .then((data) => {
        setItems(data.returns);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load returns'))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  function handleUpdated(id: string, status: ReturnStatus, note?: string) {
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, adminNote: note ?? r.adminNote } : r)),
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value as ReturnStatus | ''); }}
          aria-label="Filter by status"
          className="h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {!loading && !error && (
          <p className="ml-auto text-sm text-[var(--color-muted)]">
            {total} request{total !== 1 ? 's' : ''}
            {statusFilter ? ` with status ${statusFilter}` : ''}
          </p>
        )}
      </div>

      {loading && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 text-center text-sm text-[var(--color-muted)]">
          Loading returns…
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
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Update</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                    No return requests found.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <>
                  <tr
                    key={item.id}
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-background)]"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{item.order.orderNumber}</td>
                    <td className="px-4 py-3">{item.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect item={item} onUpdated={handleUpdated} />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                        aria-expanded={expanded === item.id}
                        className="rounded px-2 py-1 text-xs font-medium text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      >
                        {expanded === item.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expanded === item.id && <ExpandedRow key={`${item.id}-detail`} item={item} />}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-[var(--color-muted)]">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
