import type { Metadata } from "next";
import { Footer } from "../components/footer";
import { Header } from "../components/header";
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
  description: "AIPM helps teams install and manage AI skills, prompts, and tool files.",
  keywords: [
    "AI package manager",
    "AI skill registry",
    "prompt packages",
    "Cursor skills",
    "Claude skills",
    "AI tools",
  ],
  authors: [{ name: "AIPM" }],
  creator: "AIPM",
  publisher: "AIPM",
  category: "developer tools",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/aipm-logo.svg",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "AIPM",
    url: SITE_URL,
    title: "AIPM Registry",
    description: "Install and manage AI skills, prompts, and tool files.",
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
    description: "Install and manage AI skills, prompts, and tool files.",
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
        <ToastProvider />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
