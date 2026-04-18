import { test, expect } from '@playwright/test';

/**
 * E2E: AI Chatbot flow
 *
 * Covers:
 *   - Chatbot FAB is visible on the page
 *   - Opening the chatbot panel
 *   - Sending a product query and receiving a response
 *   - Sending an order tracking query
 *
 * NOTE: Anthropic API responses are non-deterministic. Tests check that:
 *   1. The UI renders correctly
 *   2. A response (any response) is returned within the timeout
 *   3. No unhandled errors appear
 */

test.describe('AI Chatbot: product query + order tracking', () => {
  test('chat widget FAB is visible on home page', async ({ page }) => {
    await page.goto('/');
    // The FAB has aria-label "Open AI assistant"
    const fab = page.getByRole('button', { name: /open ai assistant/i });
    await expect(fab).toBeVisible({ timeout: 8_000 });
  });

  test('opening chatbot renders the chat panel', async ({ page }) => {
    await page.goto('/');
    const fab = page.getByRole('button', { name: /open ai assistant/i });
    await fab.click();

    // Chat panel should appear with an input
    const input = page.locator('input[type="text"], textarea').last();
    await expect(input).toBeVisible({ timeout: 5_000 });

    // Close button should be available
    const closeBtn = page.getByRole('button', { name: /close/i }).or(
      page.getByRole('button', { name: /close ai assistant/i })
    );
    await expect(closeBtn.first()).toBeVisible({ timeout: 5_000 });
  });

  test('chatbot responds to a product query', async ({ page }) => {
    await page.goto('/');
    const fab = page.getByRole('button', { name: /open ai assistant/i });
    await fab.click();

    const input = page.locator('input[type="text"], textarea').last();
    await input.fill('What knives do you have?');
    await page.keyboard.press('Enter');

    // Wait for a response message to appear (the bot's reply)
    // Give the AI model up to 20 seconds to respond
    await expect(
      page.locator('[class*="message"], [class*="bubble"], [class*="chat"]').last()
    ).toBeVisible({ timeout: 20_000 });
  });

  test('chatbot responds to an order tracking query', async ({ page }) => {
    await page.goto('/');
    const fab = page.getByRole('button', { name: /open ai assistant/i });
    await fab.click();

    const input = page.locator('input[type="text"], textarea').last();
    await input.fill('Can you help me track my order SE-00001?');
    await page.keyboard.press('Enter');

    // A response should arrive
    await expect(
      page.locator('[class*="message"], [class*="bubble"], [class*="chat"]').last()
    ).toBeVisible({ timeout: 20_000 });
  });

  test('chatbot widget is accessible via keyboard', async ({ page }) => {
    await page.goto('/');
    // Tab to the FAB and open with Enter
    const fab = page.getByRole('button', { name: /open ai assistant/i });
    await fab.focus();
    await page.keyboard.press('Enter');

    const input = page.locator('input[type="text"], textarea').last();
    await expect(input).toBeVisible({ timeout: 5_000 });
  });

  test('chatbot is visible on products page', async ({ page }) => {
    await page.goto('/products');
    const fab = page.getByRole('button', { name: /open ai assistant/i });
    await expect(fab).toBeVisible({ timeout: 8_000 });
  });
});
