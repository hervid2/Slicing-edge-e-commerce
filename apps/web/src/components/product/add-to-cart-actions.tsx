'use client';

import { useMemo } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';

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
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);

  const inCartQty = useMemo(
    () => items.find((i) => i.productId === product.id)?.quantity ?? 0,
    [items, product.id],
  );

  const canAdd = product.stock > 0 && inCartQty < product.stock;

  return (
    <div className="mt-8 flex gap-4">
      <Button
        size="lg"
        className="flex-1"
        disabled={!canAdd}
        onClick={() =>
          addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl ?? undefined,
            quantity: 1,
            stock: product.stock,
          })
        }
      >
        {product.stock <= 0
          ? 'Out of Stock'
          : inCartQty > 0
            ? `Add Another (${inCartQty} in cart)`
            : 'Add to Cart'}
      </Button>

      <Button size="lg" variant="outline" aria-label="Add to wishlist">
        <Heart className="h-5 w-5" />
      </Button>
    </div>
  );
}
