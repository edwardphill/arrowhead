import type { Metadata } from "next";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arrowhead Atlas",
  description: "Record arrowhead finds privately, share them to a generalized community map, and explore how point types changed over 13,000 years.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="flex flex-wrap items-center gap-5 border-b border-line bg-panel px-4 py-2.5">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Arrowhead Atlas
          </Link>
          <nav className="flex gap-4 text-sm font-semibold text-muted">
            <Link href="/">Community map</Link>
            <Link href="/my">My finds</Link>
          </nav>
          <div className="ml-auto text-sm text-muted">
            <UserMenu />
          </div>
        </header>
        {!isSupabaseConfigured && (
          <div className="note note-warn mx-4 mt-4">
            This is a demo running on made-up sample finds. Finds you add are saved only in this browser.
          </div>
        )}
        <main className="mx-auto max-w-[1400px] p-4">{children}</main>
      </body>
    </html>
  );
}
