'use client';

import { useEffect, useState } from 'react';
import { listAdminUsers, updateUserRole, type AdminUser, type UserRole } from '@/lib/api/admin-users';

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-[var(--color-primary)] text-white',
  CUSTOMER: 'bg-[var(--color-background)] text-[var(--color-foreground)] border border-[var(--color-border)]',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

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

export function AdminUsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    listAdminUsers(page, 20)
      .then((data) => {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [page]);

  function handleRoleUpdated(userId: string, role: UserRole) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted)]">Loading users…</div>
    );
  }

  if (error) {
    return <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  }

  return (
    <div>
      <p className="mb-3 text-sm text-[var(--color-muted)]">{total} users total</p>

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
            </tr>
          </thead>
          <tbody>
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
                        {(user.name?.[0] ?? user.email[0]).toUpperCase()}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
    </div>
  );
}
