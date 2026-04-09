import Link from "next/link";

const CATEGORY_MAP: Record<string, string> = {
  "Chef's Knives": "chef-knives",
  "Santoku Knives": "santoku-knives",
  "Paring Knives": "paring-knives",
};

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] items-center justify-center bg-[var(--color-primary)] px-4 text-white">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            The Art of the Cut
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
            Handcrafted premium kitchen knives for chefs who demand precision,
            balance, and beauty in every blade.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-md bg-[var(--color-accent)] px-8 text-base font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Shop Now
            </Link>
            <Link
              href="/categories"
              className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-md border-2 border-white/30 px-8 text-base font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Browse Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <h2 className="font-[family-name:var(--font-heading)] text-center text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
          Our Collections
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-[var(--color-muted)]">
          Explore our curated selection of professional-grade kitchen knives.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {["Chef's Knives", "Santoku Knives", "Paring Knives"].map(
            (category) => (
              <Link
                key={category}
                href={`/products?category=${CATEGORY_MAP[category]}`}
                className="group relative flex h-64 items-end overflow-hidden rounded-lg bg-[var(--color-primary-light)] p-6 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                aria-label={`Shop ${category} collection`}
              >
                <div className="relative z-10">
                  <h3 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white">
                    {category}
                  </h3>
                  <p className="mt-1 text-sm text-white/70">Shop collection</p>
                </div>
              </Link>
            )
          )}
        </div>
      </section>

      {/* Value Propositions */}
      <section className="bg-[var(--color-surface)] px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Free Shipping", desc: "On orders over $75" },
              { title: "Handcrafted", desc: "Premium materials" },
              { title: "Lifetime Warranty", desc: "Built to last" },
              { title: "Expert Support", desc: "AI-powered assistance" },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-background)]">
                  <div className="h-6 w-6 rounded-full bg-[var(--color-accent)]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--color-primary)]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
