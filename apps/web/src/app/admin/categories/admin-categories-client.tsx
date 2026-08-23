'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionModal } from '@/components/ui/motion-modal';
import {
  listAdminCategories,
  createCategory,
  updateCategory,
  type AdminCategory,
} from '@/lib/api/admin-categories';

// ── helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Category form (create / edit) ─────────────────────────────────────────────

interface CategoryFormProps {
  initial?: AdminCategory;
  onSaved: (category: AdminCategory) => void;
  onCancel: () => void;
}

function CategoryForm({ initial, onSaved, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [position, setPosition] = useState(String(initial?.position ?? 0));
  const [slugEdited, setSlugEdited] = useState(!!initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(toSlug(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        position: Number(position),
      };
      const result = initial
        ? await updateCategory(initial.id, payload)
        : await createCategory(payload);
      onSaved(result.category);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <MotionModal onClose={onCancel} ariaLabelledBy="cat-form-title" className="max-w-md p-6">
      <h2
        id="cat-form-title"
        className="mb-4 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-primary)]"
      >
        {initial ? 'Edit Category' : 'New Category'}
      </h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="cat-name" className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
              Name <span aria-hidden="true">*</span>
            </label>
            <input
              id="cat-name"
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label htmlFor="cat-slug" className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
              Slug <span aria-hidden="true">*</span>
            </label>
            <input
              id="cat-slug"
              type="text"
              required
              minLength={2}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Lowercase letters, numbers and hyphens only"
              value={slug}
              onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              Used in URLs — lowercase, hyphens only.
            </p>
          </div>

          <div>
            <label htmlFor="cat-desc" className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
              Description
            </label>
            <textarea
              id="cat-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label htmlFor="cat-position" className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
              Display position
            </label>
            <input
              id="cat-position"
              type="number"
              min={0}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
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

export function AdminCategoriesClient() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminCategory | null | 'new'>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listAdminCategories()
      .then((data) => setCategories(data.categories))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load categories'))
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(category: AdminCategory) {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === category.id);
      return idx >= 0
        ? prev.map((c) => (c.id === category.id ? category : c))
        : [...prev, category].sort((a, b) => a.position - b.position);
    });
    setEditing(null);
  }

  async function handleToggleActive(category: AdminCategory) {
    setTogglingId(category.id);
    try {
      const result = await updateCategory(category.id, { isActive: !category.isActive });
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? result.category : c)),
      );
    } catch {
      // keep UI unchanged on failure
    } finally {
      setTogglingId(null);
    }
  }

  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        {!loading && !error && (
          <p className="text-sm text-[var(--color-muted)]">
            {activeCount} active · {categories.length - activeCount} inactive
          </p>
        )}
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="ml-auto inline-flex h-10 items-center rounded-md bg-[var(--color-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
        >
          + New Category
        </button>
      </div>

      {loading && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 text-center text-sm text-[var(--color-muted)]">
          Loading categories…
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
                <th className="px-4 py-3 font-semibold">Pos</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Products</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-muted)]">
                    No categories yet. Add the first one.
                  </td>
                </tr>
              )}
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className={`border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-background)] ${!cat.isActive ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3 text-[var(--color-muted)]">{cat.position}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-foreground)]">{cat.name}</p>
                    {cat.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-muted)]">
                        {cat.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted)]">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {cat._count?.products ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    {cat.isActive ? (
                      <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-muted)]">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(cat)}
                        className="rounded px-2 py-1 text-xs font-medium text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(cat)}
                        disabled={togglingId === cat.id}
                        aria-label={cat.isActive ? `Deactivate ${cat.name}` : `Activate ${cat.name}`}
                        className={`rounded px-2 py-1 text-xs font-medium disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 ${
                          cat.isActive
                            ? 'text-red-600 hover:bg-red-50 focus-visible:ring-red-500'
                            : 'text-green-700 hover:bg-green-50 focus-visible:ring-green-500'
                        }`}
                      >
                        {togglingId === cat.id ? '…' : cat.isActive ? 'Deactivate' : 'Activate'}
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
          <CategoryForm
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
