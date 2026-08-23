import '@testing-library/jest-dom';
import { vi } from 'vitest';

/** jsdom has no IntersectionObserver — motion's whileInView/useInView need a stub or they hang/slow down every test that renders a Reveal/RevealStagger/AnimatedCounter. */
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
