'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/stores/cart-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT_RATE } from '@slicing-edge/shared';
import { formatPrice } from '@/lib/utils';
import { createCheckout, getCart, mapCartItems } from '@/lib/api/cart';

const ADDRESS_STORAGE_KEY = 'slicing-edge-last-address';

interface SavedAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

function loadSavedAddress(): SavedAddress | null {
  try {
    const raw = localStorage.getItem(ADDRESS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedAddress) : null;
  } catch {
    return null;
  }
}

function saveAddress(address: SavedAddress) {
  try {
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(address));
  } catch {
    // ignore localStorage errors
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { sessionId, items, setItems } = useCartStore();

  const sessionUser = session?.user as
    | { name?: string | null; email?: string | null }
    | undefined;

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

  // Load cart on mount
  useEffect(() => {
    let active = true;
    setLoadingCart(true);
    setError('');
    getCart(sessionId)
      .then((data) => { if (active) setItems(mapCartItems(data.cart)); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : 'Unable to load checkout cart.'); })
      .finally(() => { if (active) setLoadingCart(false); });
    return () => { active = false; };
  }, [sessionId, setItems]);

  // Pre-fill contact from session (email + name)
  useEffect(() => {
    if (!sessionUser) return;
    if (!email && sessionUser.email) setEmail(sessionUser.email);
    if (!fullName && sessionUser.name) setFullName(sessionUser.name);
  }, [sessionUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill address from localStorage
  useEffect(() => {
    const saved = loadSavedAddress();
    if (!saved) return;
    if (!fullName && saved.fullName) setFullName(saved.fullName);
    if (!street) setStreet(saved.street);
    if (!city) setCity(saved.city);
    if (!state) setState(saved.state);
    if (!zipCode) setZipCode(saved.zipCode);
    if (!country && saved.country) setCountry(saved.country);
    if (!phone && saved.phone) setPhone(saved.phone);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
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
      const shippingAddress = { fullName, street, city, state, zipCode, country, phone: phone || undefined };

      // Persist address for next visit
      saveAddress({ fullName, street, city, state, zipCode, country, phone });

      const data = await createCheckout(sessionId, {
        guestEmail: email,
        shippingAddress,
      });

      if (data.checkoutUrl) {
        setItems([]);
        window.location.assign(data.checkoutUrl);
        return;
      }

      setItems([]);
      router.push(
        `/orders?order=${encodeURIComponent(data.order.orderNumber)}&email=${encodeURIComponent(email)}`,
      );
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
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 lg:col-span-2"
        >
          <h2 className="font-semibold text-[var(--color-primary)]">Contact</h2>
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <h2 className="pt-2 font-semibold text-[var(--color-primary)]">Shipping Address</h2>
          <Input
            id="fullName"
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
          <Input
            id="street"
            label="Street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
            autoComplete="street-address"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="city"
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              autoComplete="address-level2"
            />
            <Input
              id="state"
              label="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              autoComplete="address-level1"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="zipCode"
              label="ZIP Code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              required
              autoComplete="postal-code"
            />
            <Input
              id="country"
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              autoComplete="country"
            />
          </div>

          <Input
            id="phone"
            label="Phone (optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />

          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-[var(--color-error)]">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Processing...' : 'Place Order'}
          </Button>
        </form>

        <aside className="h-fit rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 lg:col-span-1">
          <h2 className="font-semibold text-[var(--color-primary)]">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-1 border-t border-[var(--color-border)] pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[var(--color-primary)]">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {sessionUser && (
            <p className="mt-4 text-xs text-[var(--color-muted)]">
              Signed in as {sessionUser.email}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
