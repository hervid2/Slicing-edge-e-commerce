'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Search, ShoppingBag, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') ?? '';
  const email = searchParams.get('email') ?? '';
  const status = searchParams.get('status') ?? 'success';

  const isCancelled = status === 'cancelled';

  const trackingHref =
    orderNumber && email
      ? `/orders?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`
      : `/orders${orderNumber ? `?order=${encodeURIComponent(orderNumber)}` : ''}`;

  if (isCancelled) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-10 w-10 text-[var(--color-error)]" />
        </div>

        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
          Payment Cancelled
        </h1>
        <p className="mt-3 text-[var(--color-muted)]">
          Your payment was not completed. Your order has not been placed and you have not been
          charged.
        </p>

        {orderNumber && (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Order reference:{' '}
            <span className="font-mono font-semibold text-[var(--color-primary)]">
              {orderNumber}
            </span>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/checkout">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-[var(--color-muted)]">
          If you believe this is an error, please{' '}
          <Link href="/about" className="text-[var(--color-accent)] hover:underline">
            contact us
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      {/* Success icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
        <CheckCircle className="h-10 w-10 text-[var(--color-success)]" />
      </div>

      <h1 className="mt-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        Order Placed!
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        Thank you for your purchase. Your order has been confirmed and is being processed.
      </p>

      {/* Order number */}
      {orderNumber && (
        <div className="mt-6 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Your order number</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-[var(--color-primary)]">
            {orderNumber}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Save this number to track your order</p>
        </div>
      )}

      {/* Email notice */}
      {email && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left text-sm">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
          <p className="text-[var(--color-muted)]">
            A confirmation email will be sent to{' '}
            <span className="font-semibold text-[var(--color-foreground)]">{email}</span> once your
            payment is verified by Stripe.
          </p>
        </div>
      )}

      {/* CTAs */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href={trackingHref}>
            <Search className="mr-2 h-4 w-4" />
            Track Your Order
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
          <div className="h-20 w-20 animate-pulse rounded-full bg-[var(--color-background)]" />
          <div className="mt-6 h-8 w-48 animate-pulse rounded bg-[var(--color-primary)]/20" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-[var(--color-muted)]/20" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
