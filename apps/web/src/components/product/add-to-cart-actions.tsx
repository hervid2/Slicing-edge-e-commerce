'use client';

import { useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';
import { addCartItem, getCart, mapCartItems } from '@/lib/api/cart';

interface AddToCartActionsProps {
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
  };
}

export function AddToCartActions({ product }: AddToCartActionsProps) {
  const sessionId = useCartStore((s) => s.sessionId);
  const setItems = useCartStore((s) => s.setItems);
  const items = useCartStore((s) => s.items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inCartQty = useMemo(
    () => items.find((i) => i.productId === product.id)?.quantity ?? 0,
    [items, product.id],
  );

  const canAdd = product.stock > 0 && inCartQty < product.stock;

  const handleAddToCart = async () => {
    if (!canAdd || loading) return;

    setError('');
    setLoading(true);
    try {
      await addCartItem(sessionId, product.id, 1);
      const cartRes = await getCart(sessionId);
      setItems(mapCartItems(cartRes.cart));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to add item to cart.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex gap-4">
        <Button
          size="lg"
          className="flex-1"
          disabled={!canAdd || loading}
          onClick={handleAddToCart}
        >
          {loading
            ? 'Adding...'
            : product.stock <= 0
              ? 'Out of Stock'
              : inCartQty > 0
                ? `Add Another (${inCartQty} in cart)`
                : 'Add to Cart'}
        </Button>

        <Button size="lg" variant="outline" aria-label="Add to wishlist">
          <Heart className="h-5 w-5" />
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
