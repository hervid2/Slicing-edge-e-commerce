import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header, Footer } from "@/components/layout";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { WishlistProvider } from "@/components/providers/wishlist-provider";
import { CartSyncProvider } from "@/components/providers/cart-sync-provider";
import { ChatWidget } from "@/components/chatbot/chat-widget";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://slicing-edge.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Slicing Edge — Premium Kitchen Knives",
    template: "%s | Slicing Edge",
  },
  description:
    "Discover handcrafted premium kitchen knives. From chef knives to santoku, find the perfect blade for your culinary journey.",
  openGraph: {
    type: 'website',
    siteName: 'Slicing Edge',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Skip-to-content link — WCAG 2.1 AA (2.4.1 Bypass Blocks) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-md focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>
        <AuthSessionProvider>
          <ToastProvider>
            <WishlistProvider>
              <CartSyncProvider>
                <Header />
                <main id="main-content" className="flex-1">{children}</main>
                <Footer />
                <ChatWidget />
              </CartSyncProvider>
            </WishlistProvider>
          </ToastProvider>
        </AuthSessionProvider>
        {/* Vercel Analytics — tracks page views and custom events */}
        <Analytics />
        {/* Vercel Speed Insights — collects Core Web Vitals data */}
        <SpeedInsights />
      </body>
    </html>
  );
}
