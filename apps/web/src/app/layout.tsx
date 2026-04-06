import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Header, Footer } from "@/components/layout";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { WishlistProvider } from "@/components/providers/wishlist-provider";
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

export const metadata: Metadata = {
  title: {
    default: "Slicing Edge — Premium Kitchen Knives",
    template: "%s | Slicing Edge",
  },
  description:
    "Discover handcrafted premium kitchen knives. From chef knives to santoku, find the perfect blade for your culinary journey.",
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
        <AuthSessionProvider>
          <WishlistProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </WishlistProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
