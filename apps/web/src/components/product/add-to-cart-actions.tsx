'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';
import { addCartItem, getCart, mapCartItems } from '@/lib/api/cart';
import { useToast } from '@/components/ui/toast';

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
  const { toast } = useToast();

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
      toast(`"${product.name}" added to cart!`, 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to add item to cart.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <Button
        size="lg"
        className="w-full"
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

      {error && <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
