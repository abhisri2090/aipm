import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "../components/footer";
import { GoogleAnalytics } from "../components/google-analytics";
import { Header } from "../components/header";
import { MicrosoftClarity } from "../components/microsoft-clarity";
import { ToastProvider } from "../components/toast-provider";
import { SITE_URL } from "../lib/registry";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "AIPM Registry",
  title: {
    default: "AIPM Registry",
    template: "%s | AIPM",
  },
  description:
    "AIPM is a Claude and agent skills marketplace: browse, review, and install versioned skills, prompts, and tool files.",
  keywords: [
    "Claude skills marketplace",
    "agent skills marketplace",
    "Claude skills",
    "Claude Code skills",
    "Cursor skills",
    "AI prompts",
  ],
  authors: [{ name: "AIPM" }],
  creator: "AIPM",
  publisher: "AIPM",
  category: "developer tools",
  icons: {
    icon: [
      { url: "/aipm-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/aipm-icon-192.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "AIPM",
    url: SITE_URL,
    title: "AIPM Registry",
    description: "Claude and agent skills marketplace: browse and install versioned skills and prompts.",
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "AIPM Registry - AI skills and tool files",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIPM Registry",
    description: "Claude and agent skills marketplace: browse and install versioned skills and prompts.",
    images: ["/og.svg"],
  },
};

const themeScript = `
(() => {
  const storageKey = "aipm-theme";
  const choices = ["system", "light", "dark"];
  const apply = (theme) => {
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };
  try {
    const stored = window.localStorage.getItem(storageKey);
    apply(choices.includes(stored) ? stored : "system");
  } catch {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <GoogleAnalytics />
        <MicrosoftClarity />
        <ToastProvider />
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
