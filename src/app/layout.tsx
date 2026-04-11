import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Elegant Render — Arhitektonska vizuelizacija",
    template: "%s · Elegant Render",
  },
  description:
    "Ručno izrađeni renderi, virtuelno opremanje i adaptacije prostora sa jasnim cenama i brzim procesom. Elegant Render je deo White Rook DOO.",
  metadataBase: new URL("https://elegantrender.rs"),
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sr-Latn"
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ivory text-coal font-body">
        {children}
      </body>
    </html>
  );
}
