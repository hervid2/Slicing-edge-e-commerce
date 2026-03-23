'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT_RATE } from '@slicing-edge/shared';
import { formatPrice } from '@/lib/utils';
import { createCheckout, getCart, mapCartItems } from '@/lib/api/cart';

export default function CheckoutPage() {
  const router = useRouter();
  const { sessionId, items, setItems } = useCartStore();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('US');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loadingCart, setLoadingCart] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCart = async () => {
      setLoadingCart(true);
      setError('');
      try {
        const data = await getCart(sessionId);
        if (!active) return;
        setItems(mapCartItems(data.cart));
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'Unable to load checkout cart.');
      } finally {
        if (active) setLoadingCart(false);
      }
    };

    loadCart();

    return () => {
      active = false;
    };
  }, [sessionId, setItems]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!items.length) {
      setError('Your cart is empty.');
      return;
    }

    setLoading(true);
    try {
      const data = await createCheckout(sessionId, {
        guestEmail: email,
        shippingAddress: {
          fullName,
          street,
          city,
          state,
          zipCode,
          country,
          phone: phone || undefined,
        },
      });

      if (data.checkoutUrl) {
        setItems([]);
        window.location.assign(data.checkoutUrl);
        return;
      }

      setItems([]);
      router.push(`/orders?order=${encodeURIComponent(data.order.orderNumber)}&email=${encodeURIComponent(email)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to complete checkout right now.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingCart) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-[var(--color-muted)]">
        Loading checkout...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
        Checkout
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <form onSubmit={onSubmit} className="space-y-4 lg:col-span-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="font-semibold text-[var(--color-primary)]">Contact</h2>
          <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <h2 className="pt-2 font-semibold text-[var(--color-primary)]">Shipping Address</h2>
          <Input id="fullName" label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input id="street" label="Street" value={street} onChange={(e) => setStreet(e.target.value)} required />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="city" label="City" value={city} onChange={(e) => setCity(e.target.value)} required />
            <Input id="state" label="State" value={state} onChange={(e) => setState(e.target.value)} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="zipCode" label="ZIP Code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required />
            <Input id="country" label="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
          </div>

          <Input id="phone" label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />

          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-[var(--color-error)]">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Processing...' : 'Place Order'}
          </Button>
        </form>

        <aside className="lg:col-span-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 h-fit">
          <h2 className="font-semibold text-[var(--color-primary)]">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span>{item.name} x{item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-[var(--color-border)] pt-4 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
            <div className="flex justify-between font-semibold text-[var(--color-primary)]"><span>Total</span><span>{formatPrice(total)}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
