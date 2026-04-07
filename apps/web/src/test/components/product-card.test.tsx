import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// --- mocks (must be before imports that use them) ---
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

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

vi.mock('@/components/providers/wishlist-provider', () => ({
  useWishlist: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: vi.fn(),
}));

import { useSession } from 'next-auth/react';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { useToast } from '@/components/ui/toast';
import { ProductCard } from '@/components/product/product-card';

const defaultProps = {
  id: 'prod-1',
  name: 'Chef Knife',
  slug: 'chef-knife',
  price: 99.99,
  avgRating: 4,
  reviewCount: 8,
};

describe('ProductCard', () => {
  const mockToast = vi.fn();
  const mockToggle = vi.fn();

  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({
      status: 'unauthenticated',
      data: null,
      update: vi.fn(),
    });
    vi.mocked(useWishlist).mockReturnValue({
      wishlistedIds: new Set(),
      toggle: mockToggle,
    });
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    mockToast.mockClear();
    mockToggle.mockClear();
  });

  it('renders product name and price', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('Chef Knife')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('links to the product detail page', () => {
    render(<ProductCard {...defaultProps} />);
    const link = screen.getByRole('link', { name: /chef knife/i });
    expect(link).toHaveAttribute('href', '/products/chef-knife');
  });

  it('shows Sale badge when compareAtPrice is higher than price', () => {
    render(<ProductCard {...defaultProps} compareAtPrice={149.99} />);
    expect(screen.getByText('Sale')).toBeInTheDocument();
  });

  it('does not show Sale badge when compareAtPrice is absent', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.queryByText('Sale')).not.toBeInTheDocument();
  });

  it('does not show Sale badge when compareAtPrice equals price', () => {
    render(<ProductCard {...defaultProps} compareAtPrice={99.99} />);
    expect(screen.queryByText('Sale')).not.toBeInTheDocument();
  });

  it('shows review count when reviewCount > 0', () => {
    render(<ProductCard {...defaultProps} reviewCount={8} />);
    expect(screen.getByText('(8)')).toBeInTheDocument();
  });

  it('hides rating section when reviewCount is 0', () => {
    render(<ProductCard {...defaultProps} reviewCount={0} />);
    expect(screen.queryByText('(0)')).not.toBeInTheDocument();
  });

  it('shows category label when categoryName is provided', () => {
    render(<ProductCard {...defaultProps} categoryName="Cooking" />);
    expect(screen.getByText('Cooking')).toBeInTheDocument();
  });

  it('renders image when imageUrl is provided', () => {
    render(
      <ProductCard
        {...defaultProps}
        imageUrl="https://example.com/knife.jpg"
        imageAlt="Chef knife photo"
      />,
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/knife.jpg');
    expect(img).toHaveAttribute('alt', 'Chef knife photo');
  });

  it('renders SVG placeholder when imageUrl is absent', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('hides wishlist button when user is unauthenticated', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /wishlist/i })).not.toBeInTheDocument();
  });

  it('shows wishlist button when user is authenticated', () => {
    vi.mocked(useSession).mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Test' }, expires: '2099-01-01' },
      update: vi.fn(),
    });
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /add to wishlist/i })).toBeInTheDocument();
  });

  it('shows filled heart when product is wishlisted', () => {
    vi.mocked(useSession).mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Test' }, expires: '2099-01-01' },
      update: vi.fn(),
    });
    vi.mocked(useWishlist).mockReturnValue({
      wishlistedIds: new Set(['prod-1']),
      toggle: mockToggle,
    });
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /remove from wishlist/i })).toBeInTheDocument();
  });

  it('calls toggle and shows toast when wishlist button is clicked', async () => {
    vi.mocked(useSession).mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Test' }, expires: '2099-01-01' },
      update: vi.fn(),
    });
    mockToggle.mockResolvedValue(undefined);

    render(<ProductCard {...defaultProps} />);

    const btn = screen.getByRole('button', { name: /add to wishlist/i });
    await userEvent.click(btn);

    expect(mockToggle).toHaveBeenCalledWith('prod-1');
    expect(mockToast).toHaveBeenCalledWith('"Chef Knife" saved to wishlist!', 'success');
  });

  it('shows strikethrough compareAtPrice when on sale', () => {
    render(<ProductCard {...defaultProps} compareAtPrice={149.99} />);
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });
});
