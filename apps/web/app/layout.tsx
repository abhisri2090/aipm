import type { Metadata } from "next";
import { Header } from "../components/header";
import { SITE_URL } from "../lib/registry";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AIPM Registry",
    template: "%s | AIPM",
  },
  description: "AIPM helps teams install and manage project-ready AI skills, prompts, and tool files.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
