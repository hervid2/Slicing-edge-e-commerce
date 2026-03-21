import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-primary)] sm:text-5xl">
        About Slicing Edge
      </h1>

      <div className="mt-8 space-y-6 text-lg leading-relaxed text-[var(--color-foreground)]">
        <p>
          At Slicing Edge, we believe that a great knife is the foundation of
          every memorable meal. Founded by culinary enthusiasts with a passion
          for craftsmanship, we source and create premium kitchen knives that
          blend traditional forging techniques with modern metallurgy.
        </p>
        <p>
          Every blade in our collection is selected for its balance, edge
          retention, and ergonomic design. From hand-forged Japanese steel to
          precision-ground German blades, we curate only the finest tools for
          your kitchen.
        </p>
        <p>
          Our mission is simple: to put a world-class knife in the hands of
          every cook — whether you&apos;re a Michelin-starred chef or just
          starting your culinary journey.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {[
          {
            stat: '10,000+',
            label: 'Happy Customers',
          },
          {
            stat: '50+',
            label: 'Premium Blades',
          },
          {
            stat: 'Lifetime',
            label: 'Warranty',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg bg-[var(--color-surface)] p-8 text-center shadow-sm"
          >
            <p className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-accent)]">
              {item.stat}
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
