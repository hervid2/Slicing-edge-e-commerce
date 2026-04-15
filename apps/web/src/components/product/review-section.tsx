'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

interface SessionLike {
  user?: { name?: string | null; email?: string | null };
  apiAccessToken?: string;
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const px = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${px} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <svg
            className={`h-7 w-7 transition-colors ${star <= active ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

interface ReviewFormProps {
  productId: string;
  onSubmitted: (review: Review) => void;
}

function ReviewForm({ productId, onSubmitted }: ReviewFormProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating.'); return; }
    if (comment.trim().length < 10) { setError('Comment must be at least 10 characters.'); return; }

    setError('');
    setSubmitting(true);

    try {
      const token = (session as SessionLike | null)?.apiAccessToken;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof (data as { message?: unknown }).message === 'string'
            ? (data as { message: string }).message
            : 'Failed to submit review',
        );
      }

      // Build the review locally to guarantee correct shape regardless of
      // what the API serializer returns for the nested `user` field.
      const reviewId = (data as { review?: { id?: string } }).review?.id ?? `temp-${Date.now()}`;
      const newReview: Review = {
        id: reviewId,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
        user: {
          name: session?.user?.name ?? null,
          image: (session?.user as { image?: string | null } | undefined)?.image ?? null,
        },
      };
      onSubmitted(newReview);
      setRating(0);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
    >
      <h3 className="mb-4 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
        Write a Review
      </h3>

      {error ? (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
          Your Rating
        </label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="mb-4">
        <label
          htmlFor="review-comment"
          className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
        >
          Your Review
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          minLength={10}
          maxLength={1000}
          placeholder="Share your experience with this product…"
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          required
        />
        <p className="mt-1 text-right text-xs text-[var(--color-muted)]">
          {comment.length}/1000
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 items-center rounded-md bg-[var(--color-accent)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}

interface ReviewSectionProps {
  productId: string;
  initialReviews: Review[];
}

export function ReviewSection({ productId, initialReviews }: ReviewSectionProps) {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const userId = (session?.user as { id?: string } | undefined)?.id;

  function handleReviewAdded(review: Review) {
    setReviews((prev) => [review, ...prev]);
  }

  async function handleDelete(reviewId: string) {
    setDeletingId(reviewId);
    try {
      const token = (session as SessionLike | null)?.apiAccessToken;
      const productId_ = reviews.find((r) => r.id === reviewId) ? productId : '';
      await fetch(`${API_URL}/api/products/${productId_}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch {
      // silently ignore — review stays visible
    } finally {
      setDeletingId(null);
    }
  }

  const isLoggedIn = status === 'authenticated';
  const hasAlreadyReviewed = isLoggedIn && reviews.some((r) => {
    // We don't have userId on Review from the product response, so we match by name as best-effort
    return session?.user?.name && r.user.name === session.user.name;
  });

  return (
    <section className="mt-16">
      <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
        Customer Reviews
        {reviews.length > 0 && (
          <span className="ml-2 text-lg font-normal text-[var(--color-muted)]">
            ({reviews.length})
          </span>
        )}
      </h2>

      {/* Write a review */}
      <div className="mt-6">
        {status === 'loading' ? null : isLoggedIn && !hasAlreadyReviewed ? (
          <ReviewForm productId={productId} onSubmitted={handleReviewAdded} />
        ) : isLoggedIn && hasAlreadyReviewed ? (
          <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-muted)]">
            You have already submitted a review for this product.
          </p>
        ) : (
          <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-muted)]">
            <Link href="/auth/login" className="font-medium text-[var(--color-accent)] hover:underline">
              Sign in
            </Link>{' '}
            to write a review.
          </p>
        )}
      </div>

      {/* Review list */}
      {reviews.length > 0 ? (
        <div className="mt-6 space-y-6">
          {reviews.map((review) => {
            const isOwn = isLoggedIn && session?.user?.name === review.user.name;
            return (
              <div
                key={review.id}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-background)] font-semibold text-[var(--color-primary)]">
                      {review.user.name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-foreground)]">
                        {review.user.name ?? 'Anonymous'}
                      </p>
                      <StarDisplay rating={review.rating} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <time className="text-sm text-[var(--color-muted)]">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                        aria-label="Delete review"
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        {deletingId === review.id ? 'Deleting…' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-[var(--color-foreground)]">{review.comment}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          No reviews yet. Be the first to review this product!
        </p>
      )}
    </section>
  );
}
