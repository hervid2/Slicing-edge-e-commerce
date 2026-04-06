'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/stores/cart-store';
import { getCart, mapCartItems } from '@/lib/api/cart';

/**
 * Syncs the cart with the server whenever the user authenticates.
 * This triggers the server-side guest→user cart merge automatically,
 * since the API receives both the x-session-id header and the Bearer token.
 */
export function CartSyncProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { sessionId, setItems } = useCartStore();
  const prevStatus = useRef(status);

  useEffect(() => {
    const wasUnauthenticated = prevStatus.current !== 'authenticated';
    const isNowAuthenticated = status === 'authenticated';

    if (wasUnauthenticated && isNowAuthenticated) {
      getCart(sessionId)
        .then((data) => setItems(mapCartItems(data.cart)))
        .catch(() => {
          // Silent — merge is best-effort; user can still shop
        });
    }

    prevStatus.current = status;
  }, [status, sessionId, setItems]);

  return <>{children}</>;
}
