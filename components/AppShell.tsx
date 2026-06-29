"use client";

import { BarChart3, BookOpenCheck, BookOpenText, Headphones, Layers, LayoutDashboard, Lightbulb, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { authChangedEvent, getCurrentAccount, signOutAccount, type Account } from "@/lib/auth";
import { GlassCard } from "@/components/GlassCard";

const nav = [
  { href: "/practice", label: "Questions", icon: BookOpenCheck },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/review", label: "Review", icon: BarChart3 },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/outlines", label: "Outlines", icon: BookOpenText },
  { href: "/podcasts", label: "Podcasts", icon: Headphones },
  { href: "/suggestions", label: "Suggest", icon: Lightbulb }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loaded, setLoaded] = useState(false);
  const signedIn = Boolean(account);
  const isHome = pathname === "/";

  useEffect(() => {
    let active = true;

    async function refreshAccount() {
      const currentAccount = await getCurrentAccount();

      if (!active) {
        return;
      }

      setAccount(currentAccount);
      setLoaded(true);
    }

    refreshAccount();
    window.addEventListener(authChangedEvent, refreshAccount);
    return () => {
      active = false;
      window.removeEventListener(authChangedEvent, refreshAccount);
    };
  }, []);

  useEffect(() => {
    if (loaded && signedIn && isHome) {
      router.replace("/practice");
    }
  }, [isHome, loaded, router, signedIn]);

  async function signOut() {
    await signOutAccount();
    router.push("/");
  }

  return (
    <div className="min-h-screen px-4 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col">
        <header className="glass sticky top-4 z-30 mb-8 rounded-[1.7rem] px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/brand/mbe-prep-logo.png"
                alt="MBE Prep logo"
                width={48}
                height={48}
                priority
                className="h-12 w-12 rounded-2xl object-cover shadow-lg shadow-slate-900/15"
              />
              <span>
                <span className="block text-base font-semibold tracking-tight">MBE Prep</span>
                {signedIn ? <span className="block text-xs text-slate-950/52">{account?.email}</span> : null}
              </span>
            </Link>
            {signedIn ? (
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <nav className="grid grid-cols-4 gap-1 rounded-2xl bg-white/45 p-1 sm:grid-cols-7">
                  {nav.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium text-slate-600 hover:bg-white/80 hover:text-slate-950 sm:min-h-11 sm:flex-row sm:gap-2 sm:px-2 sm:text-sm md:px-3",
                          active && "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200/70"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
                >
                  <LogOut className="mr-2 inline h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <main className="flex-1">
          {!loaded ? (
            <GlassCard>Loading account...</GlassCard>
          ) : signedIn || isHome ? (
            children
          ) : (
            <GlassCard strong className="mx-auto max-w-xl space-y-4 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Sign in to continue</h1>
              <p className="text-slate-950/64">Your questions, flashcards, outlines, podcasts, and progress are available after you sign in.</p>
              <Link href="/" className="inline-block rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
                Go to sign in
              </Link>
            </GlassCard>
          )}
        </main>
        <footer className="mt-10 pb-4 text-center text-sm text-slate-950/55">
          Original practice questions. Not official NCBE questions. For study use only.
        </footer>
      </div>
    </div>
  );
}
