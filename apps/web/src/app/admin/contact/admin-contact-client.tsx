'use client';

import { useEffect, useState } from 'react';
import {
  listAdminMessages,
  markMessageRead,
  deleteMessage,
  replyToMessage,
  type ContactMessage,
} from '@/lib/api/admin-contact';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Message detail modal ──────────────────────────────────────────────────────

interface MessageModalProps {
  msg: ContactMessage;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onRead: (id: string) => void;
}

function MessageModal({ msg, onClose, onDeleted, onRead }: MessageModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!msg.isRead) {
      markMessageRead(msg.id).then(() => onRead(msg.id)).catch(() => null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg.id]);

  async function handleReply() {
    if (!replyText.trim()) return;
    setError('');
    setSending(true);
    try {
      await replyToMessage(msg.id, replyText.trim());
      setReplySent(true);
      setReplyText('');
      onRead(msg.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    setError('');
    setDeleting(true);
    try {
      await deleteMessage(msg.id);
      onDeleted(msg.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="msg-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <h2
          id="msg-modal-title"
          className="mb-1 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-primary)]"
        >
          {msg.subject}
        </h2>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          From <strong>{msg.name}</strong> ({msg.email}) · {formatDate(msg.createdAt)}
        </p>
        <p className="whitespace-pre-wrap rounded-lg bg-[var(--color-background)] p-4 text-sm text-[var(--color-foreground)]">
          {msg.message}
        </p>

        {/* Reply section */}
        <div className="mt-5">
          <label
            htmlFor="reply-textarea"
            className="mb-1.5 block text-sm font-semibold text-[var(--color-foreground)]"
          >
            Reply to {msg.name}
          </label>
          <textarea
            id="reply-textarea"
            value={replyText}
            onChange={(e) => { setReplySent(false); setReplyText(e.target.value); }}
            disabled={sending}
            rows={4}
            placeholder={`Write your reply to ${msg.email}…`}
            className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50"
          />
          {replySent && (
            <p className="mt-1.5 text-sm font-medium text-[var(--color-accent)]">
              Reply sent successfully.
            </p>
          )}
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting || sending}
            className="inline-flex h-10 items-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-md border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void handleReply()}
            disabled={sending || !replyText.trim()}
            className="inline-flex h-10 items-center rounded-md bg-[var(--color-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-primary-light)] disabled:opacity-40"
          >
            {sending ? 'Sending…' : 'Send Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminContactClient() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    listAdminMessages(page, 20, unreadOnly || undefined)
      .then((data) => {
        setMessages(data.messages);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load messages'))
      .finally(() => setLoading(false));
  }, [page, unreadOnly]);

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => { setPage(1); setUnreadOnly(e.target.checked); }}
            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
          />
          Unread only
        </label>
        {!loading && !error && (
          <p className="ml-auto text-sm text-[var(--color-muted)]">
            {total} message{total !== 1 ? 's' : ''}
            {unreadCount > 0 && !unreadOnly ? ` · ${unreadCount} unread` : ''}
          </p>
        )}
      </div>

      {loading && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 text-center text-sm text-[var(--color-muted)]">
          Loading messages…
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
                <th className="px-4 py-3 font-semibold">From</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                    No messages found.
                  </td>
                </tr>
              )}
              {messages.map((msg) => (
                <tr
                  key={msg.id}
                  className={`border-t border-[var(--color-border)] hover:bg-[var(--color-background)] ${!msg.isRead ? 'font-medium' : ''}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-[var(--color-foreground)]">{msg.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{msg.email}</p>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-[var(--color-foreground)]">
                    {msg.subject}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{formatDate(msg.createdAt)}</td>
                  <td className="px-4 py-3">
                    {msg.isRead ? (
                      <span className="text-xs text-[var(--color-muted)]">Read</span>
                    ) : (
                      <span className="inline-block rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-semibold text-white">
                        New
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(msg)}
                      className="rounded px-2 py-1 text-xs font-medium text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    >
                      Open
                    </button>
                  </td>
                </tr>
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

      {selected && (
        <MessageModal
          msg={selected}
          onClose={() => setSelected(null)}
          onDeleted={(id) => {
            setMessages((prev) => prev.filter((m) => m.id !== id));
            setTotal((prev) => prev - 1);
          }}
          onRead={(id) => setMessages((prev) => prev.map((m) => m.id === id ? { ...m, isRead: true } : m))}
        />
      )}
    </div>
  );
}
