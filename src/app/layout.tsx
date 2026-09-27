import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import "./globals.css";

// Every page reads the signed-in user from cookies.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arrowhead Atlas",
  description: "Record arrowhead finds privately, share them to a generalized community map, and explore how point types changed over 13,000 years.",
};

async function currentUserEmail(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const email = await currentUserEmail();
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
            {email ? (
              <form action="/auth/signout" method="post" className="flex items-center gap-3">
                <span>{email}</span>
                <button className="btn btn-ghost">Sign out</button>
              </form>
            ) : (
              <Link href="/login" className="font-semibold text-accent">
                Sign in
              </Link>
            )}
          </div>
        </header>
        {!isSupabaseConfigured && (
          <div className="note note-warn m-4">
            Supabase isn&apos;t configured. Copy <code>.env.example</code> to <code>.env.local</code> and fill in your project&apos;s URL and anon key.
          </div>
        )}
        <main className="mx-auto max-w-[1400px] p-4">{children}</main>
      </body>
    </html>
  );
}
