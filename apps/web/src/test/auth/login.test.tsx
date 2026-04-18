import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

// Mock UI components to avoid CSS variable and Tailwind rendering issues
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    type,
    disabled,
    onClick,
  }: {
    children: React.ReactNode;
    type?: 'submit' | 'button';
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({
    id,
    label,
    type = 'text',
    value,
    onChange,
    required,
  }: {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    [key: string]: unknown;
  }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} onChange={onChange} required={required} />
    </div>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Prevent dynamic import from actually importing auth-client
vi.mock('@/lib/auth-client', () => ({
  signIn: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

import LoginPage from '@/app/auth/login/page';
import * as authClient from '@/lib/auth-client';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('has a link to the register page', () => {
    render(<LoginPage />);
    const registerLink = screen.getByRole('link', { name: /create one/i });
    expect(registerLink).toHaveAttribute('href', '/auth/register');
  });

  it('has a link to forgot password page', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
      'href',
      '/auth/forgot-password',
    );
  });

  it('shows loading state while signing in', async () => {
    vi.mocked(authClient.signIn).mockReturnValue(new Promise(() => {}));

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('shows error message on failed sign-in', async () => {
    vi.mocked(authClient.signIn).mockRejectedValue(new Error('Unauthorized'));

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'WrongPass1');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('calls signIn with email and password on submit', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(authClient.signIn).mockResolvedValue(undefined as any);

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authClient.signIn).toHaveBeenCalledWith('user@example.com', 'Secret123');
    });
  });

  it('has Google sign-in button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });
});
