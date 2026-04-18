import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/api/cart', () => ({
  getCart: vi.fn(),
  mapCartItems: vi.fn(),
  removeCartItem: vi.fn(),
  updateCartItem: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/stores/cart-store', () => ({
  useCartStore: vi.fn(),
}));

import { getCart, mapCartItems, removeCartItem, updateCartItem } from '@/lib/api/cart';
import { useToast } from '@/components/ui/toast';
import { useCartStore } from '@/stores/cart-store';
import CartPage from '@/app/cart/page';

const mockToast = vi.fn();
const mockSetItems = vi.fn();

const sampleItems = [
  {
    id: 'item-1',
    productId: 'prod-1',
    name: 'Chef Knife',
    price: 89.99,
    quantity: 1,
    stock: 10,
    imageUrl: undefined,
  },
  {
    id: 'item-2',
    productId: 'prod-2',
    name: 'Paring Knife',
    price: 39.99,
    quantity: 2,
    stock: 5,
    imageUrl: undefined,
  },
];

describe('CartPage', () => {
  beforeEach(() => {
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    vi.mocked(getCart).mockResolvedValue({ cart: { id: 'cart-1', items: [] } } as Awaited<ReturnType<typeof getCart>>);
    vi.mocked(mapCartItems).mockReturnValue([]);
    mockToast.mockClear();
    mockSetItems.mockClear();
  });

  it('shows empty cart state when items list is empty after loading', async () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: [],
      sessionId: 'test-session',
      setItems: mockSetItems,
      clearCart: vi.fn(),
      getTotal: vi.fn(() => 0),
      getItemCount: vi.fn(() => 0),
    });

    render(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText('Your Cart is Empty')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /browse knives/i })).toHaveAttribute('href', '/products');
  });

  it('shows skeleton loader while loading', () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: [],
      sessionId: 'test-session',
      setItems: mockSetItems,
      clearCart: vi.fn(),
      getTotal: vi.fn(() => 0),
      getItemCount: vi.fn(() => 0),
    });

    // Keep getCart pending so loading stays true
    vi.mocked(getCart).mockReturnValue(new Promise(() => {}));
    const { container } = render(<CartPage />);

    // Skeleton wrapper has aria-busy="true"
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders cart items when items exist', async () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: sampleItems,
      sessionId: 'test-session',
      setItems: mockSetItems,
      clearCart: vi.fn(),
      getTotal: vi.fn(() => 169.97),
      getItemCount: vi.fn(() => 3),
    });

    render(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText('Chef Knife')).toBeInTheDocument();
      expect(screen.getByText('Paring Knife')).toBeInTheDocument();
    });
  });

  it('displays correct item count in heading', async () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: sampleItems,
      sessionId: 'test-session',
      setItems: mockSetItems,
      clearCart: vi.fn(),
      getTotal: vi.fn(() => 169.97),
      getItemCount: vi.fn(() => 3),
    });

    render(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText(/3 items in your cart/i)).toBeInTheDocument();
    });
  });

  it('shows free shipping when subtotal >= $75', async () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: [{ ...sampleItems[0], price: 89.99, quantity: 1 }],
      sessionId: 'test-session',
      setItems: mockSetItems,
      clearCart: vi.fn(),
      getTotal: vi.fn(() => 89.99),
      getItemCount: vi.fn(() => 1),
    });

    render(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });

  it('shows flat shipping rate when subtotal < $75', async () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: [{ ...sampleItems[0], price: 30, quantity: 1 }],
      sessionId: 'test-session',
      setItems: mockSetItems,
      clearCart: vi.fn(),
      getTotal: vi.fn(() => 30),
      getItemCount: vi.fn(() => 1),
    });

    render(<CartPage />);

    await waitFor(() => {
      // $9.99 flat rate displayed
      expect(screen.getByText('$9.99')).toBeInTheDocument();
      // Upsell message
      expect(screen.getByText(/add.*for free shipping/i)).toBeInTheDocument();
    });
  });

  it('calls removeCartItem and shows toast when remove button is clicked', async () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: sampleItems,
      sessionId: 'test-session',
      setItems: mockSetItems,
      clearCart: vi.fn(),
      getTotal: vi.fn(() => 169.97),
      getItemCount: vi.fn(() => 3),
    });
    vi.mocked(removeCartItem).mockResolvedValue(undefined);
    vi.mocked(getCart).mockResolvedValue({ cart: { id: 'cart-1', items: [] } } as Awaited<ReturnType<typeof getCart>>);
    vi.mocked(mapCartItems).mockReturnValue([]);

    render(<CartPage />);

    await waitFor(() => expect(screen.getByText('Chef Knife')).toBeInTheDocument());

    const removeBtn = screen.getAllByRole('button', { name: /remove chef knife/i })[0];
    await userEvent.click(removeBtn);

    expect(removeCartItem).toHaveBeenCalledWith('test-session', 'item-1');
    expect(mockToast).toHaveBeenCalledWith('Item removed from cart', 'info');
  });

  it('links to checkout page', async () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: sampleItems,
      sessionId: 'test-session',
      setItems: mockSetItems,
      clearCart: vi.fn(),
      getTotal: vi.fn(() => 169.97),
      getItemCount: vi.fn(() => 3),
    });

    render(<CartPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /proceed to checkout/i })).toHaveAttribute(
        'href',
        '/checkout',
      );
    });
  });

  it('calls updateCartItem when quantity increase button is clicked', async () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: sampleItems,
      sessionId: 'test-session',
      setItems: mockSetItems,
      clearCart: vi.fn(),
      getTotal: vi.fn(() => 169.97),
      getItemCount: vi.fn(() => 3),
    });
    vi.mocked(updateCartItem).mockResolvedValue({ item: {} });
    vi.mocked(getCart).mockResolvedValue({ cart: { id: 'cart-1', items: [] } } as Awaited<ReturnType<typeof getCart>>);
    vi.mocked(mapCartItems).mockReturnValue(sampleItems);

    render(<CartPage />);

    await waitFor(() => expect(screen.getByText('Chef Knife')).toBeInTheDocument());

    const increaseButtons = screen.getAllByRole('button', { name: /increase quantity/i });
    await userEvent.click(increaseButtons[0]);

    expect(updateCartItem).toHaveBeenCalledWith('test-session', 'item-1', 2);
  });
});
