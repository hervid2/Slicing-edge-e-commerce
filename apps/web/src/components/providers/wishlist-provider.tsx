'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SessionLike {
  apiAccessToken?: string;
}

interface WishlistContextValue {
  wishlistedIds: Set<string>;
  toggle: (productId: string) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextValue>({
  wishlistedIds: new Set(),
  toggle: async () => {},
  loading: false,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch wishlist IDs once on login
  useEffect(() => {
    if (status !== 'authenticated') {
      setWishlistedIds(new Set());
      return;
    }

    const token = (session as SessionLike | null)?.apiAccessToken;
    if (!token) return;

    setLoading(true);
    fetch(`${API_URL}/api/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: { items: Array<{ productId: string }> }) => {
        setWishlistedIds(new Set(data.items.map((i) => i.productId)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, session]);

  const toggle = useCallback(
    async (productId: string) => {
      const token = (session as SessionLike | null)?.apiAccessToken;
      if (!token) return;

      // Optimistic update
      setWishlistedIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });

      try {
        const res = await fetch(`${API_URL}/api/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });

        if (!res.ok) {
          // Revert on error
          setWishlistedIds((prev) => {
            const next = new Set(prev);
            if (next.has(productId)) {
              next.delete(productId);
            } else {
              next.add(productId);
            }
            return next;
          });
        }
      } catch {
        // Revert on network error
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          if (next.has(productId)) {
            next.delete(productId);
          } else {
            next.add(productId);
          }
          return next;
        });
      }
    },
    [session],
  );

  return (
    <WishlistContext.Provider value={{ wishlistedIds, toggle, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
