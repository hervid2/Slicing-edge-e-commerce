'use client';

import { useEffect, useRef, useState } from 'react';
import {
  listAdminUsers,
  updateUserRole,
  deleteAdminUser,
  inviteAdminUser,
  type AdminUser,
  type UserRole,
} from '@/lib/api/admin-users';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-[var(--color-primary)] text-white',
  CUSTOMER:
    'bg-[var(--color-background)] text-[var(--color-foreground)] border border-[var(--color-border)]',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Role select ───────────────────────────────────────────────────────────────

interface RoleSelectProps {
  user: AdminUser;
  onUpdated: (userId: string, role: UserRole) => void;
}

function RoleSelect({ user, onUpdated }: RoleSelectProps) {
  const [value, setValue] = useState<UserRole>(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleChange(next: UserRole) {
    if (next === value) return;
    setError('');
    setLoading(true);
    try {
      await updateUserRole(user.id, next);
      setValue(next);
      onUpdated(user.id, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={value}
        disabled={loading}
        onChange={(e) => void handleChange(e.target.value as UserRole)}
        aria-label={`Change role for ${user.email}`}
        className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
      >
        <option value="CUSTOMER">Customer</option>
        <option value="ADMIN">Admin</option>
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Invite modal ──────────────────────────────────────────────────────────────

interface InviteModalProps {
  onClose: () => void;
  onInvited: () => void;
}

function InviteModal({ onClose, onInvited }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await inviteAdminUser(email.trim());
      setSuccess(`Invitation sent to ${result.email}. They'll receive an email to set up their account.`);
      setTimeout(() => {
        onInvited();
        onClose();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div className="w-full max-w-md rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <h2
          id="invite-modal-title"
          className="mb-4 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-primary)]"
        >
          Invite New Admin
        </h2>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          Enter the email address of the person you want to invite as an administrator. They will
          receive an email with a link to set up their password.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="invite-email"
              className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
            >
              Email address
            </label>
            <input
              id="invite-email"
              ref={inputRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
          </div>

          <div className="rounded-md bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-muted)]">
            Role: <span className="font-semibold text-[var(--color-primary)]">Admin</span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-10 items-center rounded-md border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-background)] disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="inline-flex h-10 items-center rounded-md bg-[var(--color-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
            >
              {loading ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirmation ───────────────────────────────────────────────────────

interface DeleteConfirmProps {
  user: AdminUser;
  onClose: () => void;
  onDeleted: (userId: string) => void;
}

function DeleteConfirm({ user, onClose, onDeleted }: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setError('');
    setLoading(true);
    try {
      await deleteAdminUser(user.id);
      onDeleted(user.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="w-full max-w-sm rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <h2
          id="delete-modal-title"
          className="mb-2 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-primary)]"
        >
          Delete Account
        </h2>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          Are you sure you want to permanently delete{' '}
          <strong className="text-[var(--color-foreground)]">
            {user.name ?? user.email}
          </strong>
          ? This action cannot be undone.
        </p>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 items-center rounded-md border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-background)] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={loading}
            className="inline-flex h-10 items-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminUsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    listAdminUsers(page, 20, search || undefined)
      .then((data) => {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, search]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearch(value);
    }, 400);
  }

  function handleRoleUpdated(userId: string, role: UserRole) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }

  function handleDeleted(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setTotal((prev) => prev - 1);
  }

  function handleInvited() {
    setPage(1);
    setSearch('');
    setSearchInput('');
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name or email…"
          aria-label="Search users"
          className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] sm:w-72"
        />
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="ml-auto inline-flex h-10 items-center rounded-md bg-[var(--color-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
        >
          + Invite Admin
        </button>
      </div>

      {/* Count */}
      {!loading && !error && (
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          {total} user{total !== 1 ? 's' : ''}{search ? ` matching "${search}"` : ' total'}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 text-center text-sm text-[var(--color-muted)]">
          Loading users…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--color-background)] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Current Role</th>
                <th className="px-4 py-3 font-semibold">Change Role</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">Verified</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-[var(--color-muted)]"
                  >
                    {search ? 'No users match your search.' : 'No users found.'}
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-[var(--color-border)] hover:bg-[var(--color-background)]"
                >
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={user.name ?? user.email}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white">
                          {(user.name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[var(--color-foreground)]">
                          {user.name ?? '—'}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Current role badge */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.role]}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Role select */}
                  <td className="px-4 py-3">
                    <RoleSelect user={user} onUpdated={handleRoleUpdated} />
                  </td>

                  {/* Orders */}
                  <td className="px-4 py-3 text-center text-sm">{user._count.orders}</td>

                  {/* Email verified */}
                  <td className="px-4 py-3">
                    {user.emailVerified ? (
                      <span className="text-xs text-green-600">✓ Verified</span>
                    ) : (
                      <span className="text-xs text-[var(--color-muted)]">Unverified</span>
                    )}
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-sm text-[var(--color-muted)]">
                    {formatDate(user.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDeletingUser(user)}
                      aria-label={`Delete account of ${user.email}`}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
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
          <span className="text-sm text-[var(--color-muted)]">
            Page {page} of {totalPages}
          </span>
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

      {/* Modals */}
      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onInvited={handleInvited} />
      )}
      {deletingUser && (
        <DeleteConfirm
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
