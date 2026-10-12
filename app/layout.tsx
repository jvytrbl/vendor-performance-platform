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
  title: "Vantage",
  description: "Periodic vendor performance reports from recorded transactions.",
};

// Runs before paint, before React hydrates — reads the saved theme choice
// (falling back to OS preference when nothing's been chosen yet) and sets
// data-theme on <html> immediately, so there's no flash of the wrong theme.
// Kept as a plain string, not an import, because it must execute standalone
// in the browser before any module code runs; mirrors the same "stored
// choice, then OS preference" logic as lib/ui/theme/themeStorage.ts.
const SET_INITIAL_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme-preference");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      // The theme script below sets data-theme on this element before React
      // hydrates, so the server-rendered markup (which has no data-theme —
      // the server doesn't know the client's stored preference) will always
      // differ from the client's. That specific, expected mismatch is what
      // this suppresses — it does not hide other hydration bugs, since it
      // only applies to this element's own attributes, not its subtree.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SET_INITIAL_THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <MsalProviderWrapper>
          <AppShell>{children}</AppShell>
        </MsalProviderWrapper>
      </body>
    </html>
  );
}
