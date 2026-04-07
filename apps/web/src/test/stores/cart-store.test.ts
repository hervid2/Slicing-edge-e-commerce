import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/stores/cart-store';

const sampleItem = {
  id: 'item-1',
  productId: 'prod-1',
  name: 'Chef Knife',
  price: 99.99,
  quantity: 2,
  stock: 10,
};

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], sessionId: 'test-session' });
  });

  it('starts with empty items', () => {
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('has a sessionId on init', () => {
    expect(useCartStore.getState().sessionId).toBe('test-session');
  });

  it('setItems replaces the items list', () => {
    useCartStore.getState().setItems([sampleItem]);
    expect(useCartStore.getState().items).toEqual([sampleItem]);
  });

  it('clearCart empties the items', () => {
    useCartStore.setState({ items: [sampleItem] });
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('getTotal returns sum of price * quantity', () => {
    useCartStore.setState({
      items: [
        { ...sampleItem, price: 50, quantity: 2 },
        { ...sampleItem, id: 'item-2', productId: 'prod-2', price: 30, quantity: 1 },
      ],
    });
    expect(useCartStore.getState().getTotal()).toBe(130);
  });

  it('getTotal returns 0 for empty cart', () => {
    expect(useCartStore.getState().getTotal()).toBe(0);
  });

  it('getItemCount sums all quantities', () => {
    useCartStore.setState({
      items: [
        { ...sampleItem, quantity: 3 },
        { ...sampleItem, id: 'item-2', productId: 'prod-2', quantity: 2 },
      ],
    });
    expect(useCartStore.getState().getItemCount()).toBe(5);
  });

  it('getItemCount returns 0 for empty cart', () => {
    expect(useCartStore.getState().getItemCount()).toBe(0);
  });

  it('setItems with empty array clears cart', () => {
    useCartStore.setState({ items: [sampleItem] });
    useCartStore.getState().setItems([]);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
