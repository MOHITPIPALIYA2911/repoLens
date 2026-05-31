import Image from "next/image";
import Link from "next/link";
import { Bungee } from "next/font/google";
import { GitBranch, Home, Scale, Trophy, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";

const displayFont = Bungee({
  subsets: ["latin"],
  weight: "400",
});

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Repo Analyzer",
    href: "/analyze/repo",
    icon: GitBranch,
  },
  {
    label: "Profile Analyzer",
    href: "/analyze/profile",
    icon: UserRound,
  },
  {
    label: "Compare",
    href: "/compare/repo",
    icon: Scale,
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
    icon: Trophy,
  },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/repolens-logo.png"
            alt="RepoLens Logo"
            width={230}
            height={70}
            priority
            className="h-14 w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-cyan-700"
              >
                <Icon className="h-4 w-4 transition group-hover:scale-110" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Button
          asChild
          className={`${displayFont.className} hidden bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-500 text-xs tracking-wide text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-300 hover:via-sky-400 hover:to-emerald-400 sm:inline-flex`}
        >
          <Link href="/analyze/profile">Analyze</Link>
        </Button>
      </div>
    </header>
  );
}