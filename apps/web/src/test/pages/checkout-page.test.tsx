import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('@/lib/api/cart', () => ({
  getCart: vi.fn(),
  mapCartItems: vi.fn(),
  createCheckout: vi.fn(),
}));

vi.mock('@/stores/cart-store', () => ({
  useCartStore: vi.fn(),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({
    id,
    label,
    value,
    onChange,
    required,
    type = 'text',
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    type?: string;
    [key: string]: unknown;
  }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} onChange={onChange} required={required} />
    </div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    type,
    disabled,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    type?: 'submit' | 'button';
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
  }) => (
    <button type={type} disabled={disabled} className={className} onClick={onClick}>
      {children}
    </button>
  ),
}));

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getCart, mapCartItems, createCheckout } from '@/lib/api/cart';
import { useCartStore } from '@/stores/cart-store';
import CheckoutPage from '@/app/checkout/page';

const mockPush = vi.fn();
const mockSetItems = vi.fn();

const sampleItems = [
  { id: 'item-1', productId: 'prod-1', name: 'Chef Knife', price: 89.99, quantity: 1, stock: 10 },
];

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as ReturnType<typeof useRouter>);
    vi.mocked(useSession).mockReturnValue({ status: 'unauthenticated', data: null, update: vi.fn() });
    vi.mocked(getCart).mockResolvedValue({ cart: [] });
    vi.mocked(mapCartItems).mockReturnValue(sampleItems);
    vi.mocked(useCartStore).mockReturnValue({
      items: sampleItems,
      sessionId: 'test-session',
      setItems: mockSetItems,
      clearCart: vi.fn(),
      getTotal: vi.fn(() => 89.99),
      getItemCount: vi.fn(() => 1),
    });
    mockPush.mockClear();
    mockSetItems.mockClear();
  });

  it('shows loading state initially', () => {
    vi.mocked(getCart).mockReturnValue(new Promise(() => {}));
    render(<CheckoutPage />);
    expect(screen.getByText(/loading checkout/i)).toBeInTheDocument();
  });

  it('renders the checkout form after loading', async () => {
    render(<CheckoutPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street/i)).toBeInTheDocument();
  });

  it('pre-fills email and name from session', async () => {
    vi.mocked(useSession).mockReturnValue({
      status: 'authenticated',
      data: {
        user: { name: 'Jane Doe', email: 'jane@example.com' },
        expires: '2099-01-01',
      },
      update: vi.fn(),
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    });
  });

  it('shows signed-in email in order summary aside', async () => {
    vi.mocked(useSession).mockReturnValue({
      status: 'authenticated',
      data: {
        user: { name: 'Jane Doe', email: 'jane@example.com' },
        expires: '2099-01-01',
      },
      update: vi.fn(),
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByText(/signed in as jane@example\.com/i)).toBeInTheDocument();
    });
  });

  it('shows order summary items', async () => {
    render(<CheckoutPage />);
    await waitFor(() => {
      expect(screen.getByText(/chef knife x1/i)).toBeInTheDocument();
    });
  });

  it('shows free shipping in summary when subtotal >= $75', async () => {
    render(<CheckoutPage />);
    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });

  it('shows error when submitting empty cart', async () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: [],
      sessionId: 'test-session',
      setItems: mockSetItems,
      clearCart: vi.fn(),
      getTotal: vi.fn(() => 0),
      getItemCount: vi.fn(() => 0),
    });

    const { container } = render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
    });

    // Use fireEvent.submit to bypass HTML5 native form validation
    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
    });
  });

  it('redirects to Stripe when checkoutUrl is returned', async () => {
    vi.mocked(createCheckout).mockResolvedValue({
      checkoutUrl: 'https://stripe.com/checkout/test',
    });

    // jsdom's window.location is not fully writable; stub assign globally
    const mockAssign = vi.fn();
    vi.stubGlobal('location', { assign: mockAssign, href: '' });

    const { container } = render(<CheckoutPage />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument(),
    );

    // Submit via fireEvent to bypass HTML5 native validation
    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockAssign).toHaveBeenCalledWith('https://stripe.com/checkout/test');
    });

    vi.unstubAllGlobals();
  });

  it('shows error message when checkout API fails', async () => {
    vi.mocked(createCheckout).mockRejectedValue(new Error('Payment service unavailable'));

    const { container } = render(<CheckoutPage />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument(),
    );

    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Payment service unavailable')).toBeInTheDocument();
    });
  });
});
