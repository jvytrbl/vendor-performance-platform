import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import MsalProviderWrapper from "@/components/auth/MsalProviderWrapper";
import AppShell from "@/components/layout/AppShell";

// UI face. Body, tables, forms, buttons, nav labels, and metadata.
const inter = Inter({
  variable: "--font-sans-custom",
  subsets: ["latin"],
});

// Heading face. Page titles, the wordmark, and report section headings only.
// Large sizes. Not italic, and not used for table data or empty-state copy.
const playfair = Playfair_Display({
  variable: "--font-display-custom",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Vendor Performance Platform",
  description: "Periodic vendor performance reports from recorded transactions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MsalProviderWrapper>
          <AppShell>{children}</AppShell>
        </MsalProviderWrapper>
      </body>
    </html>
  );
}
