import { test, expect } from '@playwright/test';
import { getFirstProductSlug } from './helpers/api';

/**
 * E2E: Authenticated user full flow
 *
 * Covers: register → verify (skipped in test mode) → login → browse → add to cart →
 *         checkout (pre-filled) → order history
 *
 * NOTE: Email verification is not testable in E2E without a real inbox.
 * Tests use a pre-existing seeded test user (admin@slicing-edge.com / admin123)
 * or a freshly registered account if the register flow is being verified.
 */

const TEST_USER = {
  email: 'e2e-auth@slicingtest.com',
  password: 'TestPass123!',
  name: 'E2E Auth User',
};

test.describe('Authenticated flow: login → cart → checkout → order history', () => {
  test('register page renders and validates fields', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    const submitBtn = page.getByRole('button', { name: /create account|register|sign up/i });
    await expect(submitBtn).toBeVisible();
  });

  test('register shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByRole('button', { name: /create account|register|sign up/i }).click();
    // At least one required-field error visible
    const errors = page.locator('[class*="error"], [class*="red"], [aria-describedby], :invalid');
    await expect(errors.first()).toBeVisible({ timeout: 5_000 });
  });

  test('login page renders and shows fields', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).first().fill('nobody@example.com');
    await page.getByLabel(/password/i).first().fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Error or alert appears
    await expect(
      page.locator('[class*="error"], [class*="red"], [role="alert"], [class*="alert"]').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('login with admin credentials succeeds and redirects', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).first().fill('admin@slicing-edge.com');
    await page.getByLabel(/password/i).first().fill('admin123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Should redirect away from /auth/login
    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });

  test('authenticated user sees account link in header', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).first().fill('admin@slicing-edge.com');
    await page.getByLabel(/password/i).first().fill('admin123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10_000 });

    // Navigate home and verify account link
    await page.goto('/');
    const accountLink = page.getByRole('link', { name: /account|profile/i });
    await expect(accountLink).toBeVisible({ timeout: 8_000 });
  });

  test('authenticated user can add to cart and see checkout pre-filled', async ({ page }) => {
    const slug = await getFirstProductSlug();
    if (!slug) {
      test.skip(true, 'No products in DB — run the seed first');
      return;
    }

    // Login
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).first().fill('admin@slicing-edge.com');
    await page.getByLabel(/password/i).first().fill('admin123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10_000 });

    // Add product to cart
    await page.goto(`/products/${slug}`);
    await page.getByRole('button', { name: /add to cart/i }).click();

    // Go to checkout
    await page.goto('/checkout');
    // Email should be pre-filled with the logged-in user's email
    const emailInput = page.getByLabel(/email/i).first();
    await expect(emailInput).toBeVisible({ timeout: 8_000 });
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toBeTruthy();
  });

  test('account page loads for authenticated user', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).first().fill('admin@slicing-edge.com');
    await page.getByLabel(/password/i).first().fill('admin123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10_000 });

    await page.goto('/account');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8_000 });
  });

  test('order history page loads for authenticated user', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).first().fill('admin@slicing-edge.com');
    await page.getByLabel(/password/i).first().fill('admin123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10_000 });

    await page.goto('/account/orders');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8_000 });
  });

  test('forgot password page renders', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /send|reset/i })).toBeVisible();
  });

  test('wishlist page redirects or loads correctly', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).first().fill('admin@slicing-edge.com');
    await page.getByLabel(/password/i).first().fill('admin123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10_000 });

    await page.goto('/wishlist');
    // Should show wishlist page (empty state or items)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8_000 });
  });
});
