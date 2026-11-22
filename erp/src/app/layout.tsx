import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Bundled with the app (variable font, OFL) so builds never depend on Google Fonts being reachable.
const inter = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ConstructAI", template: "%s · ConstructAI" },
  description: "Track projects, costs, billings and profit — built for Philippine contractors.",
};

export const viewport: Viewport = {
  themeColor: "#1f5eff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
