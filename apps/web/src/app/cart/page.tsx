'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { formatPrice } from '@/lib/utils';
import { SHIPPING_FLAT_RATE, FREE_SHIPPING_THRESHOLD } from '@slicing-edge/shared';
import { getCart, mapCartItems, removeCartItem, updateCartItem } from '@/lib/api/cart';

export default function CartPage() {
  const { sessionId, items, setItems } = useCartStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshCart = async () => {
    const data = await getCart(sessionId);
    setItems(mapCartItems(data.cart));
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getCart(sessionId);
        if (!active) return;
        setItems(mapCartItems(data.cart));
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'Unable to load cart.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [sessionId, setItems]);

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setError('');
    try {
      await updateCartItem(sessionId, itemId, quantity);
      await refreshCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update quantity.');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setError('');
    try {
      await removeCartItem(sessionId, itemId);
      await refreshCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to remove item.');
    }
  };

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const total = subtotal + shipping;
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-[var(--color-muted)]">
        Loading cart...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-[var(--color-muted)]" />
        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
          Your Cart is Empty
        </h1>
        <p className="mt-3 text-[var(--color-muted)]">
          Looks like you haven&apos;t added any knives yet.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-[var(--color-accent)] px-8 text-base font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
        Shopping Cart
      </h1>
      {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-[var(--color-error)]">{error}</p>}
      <p className="mt-2 text-[var(--color-muted)]">
        {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:gap-6 sm:p-6"
              >
                {/* Image */}
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-[var(--color-background)] sm:h-32 sm:w-32">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-[var(--color-primary)]">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                    <p className="text-lg font-bold text-[var(--color-primary)]">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background)] disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background)] disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="inline-flex items-center gap-1.5 text-sm text-[var(--color-error)] transition-colors hover:text-red-700"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-primary)]">
              Order Summary
            </h2>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-[var(--color-success)]">Free</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="text-xs text-[var(--color-accent)]">
                  Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping!
                </p>
              )}
              <div className="border-t border-[var(--color-border)] pt-3">
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-[var(--color-primary)]">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-[var(--color-accent)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Proceed to Checkout
            </Link>

            <div className="mt-4 text-center">
              <Link
                href="/products"
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
