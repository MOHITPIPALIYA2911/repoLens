"use client";

import Image from "next/image";
import Link from "next/link";
import { Bungee } from "next/font/google";
import { GitBranch, Home, Menu, Scale, Trophy, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

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
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center">
          <Image
            src="/brand/repolens-logo.png"
            alt="RepoLens Logo"
            width={230}
            height={70}
            priority
            className="h-10 w-auto object-contain sm:h-14"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-cyan-700 xl:px-4"
              >
                <Icon className="h-4 w-4 transition group-hover:scale-110" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className={`${displayFont.className} hidden bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-500 text-xs tracking-wide text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-300 hover:via-sky-400 hover:to-emerald-400 md:inline-flex`}
          >
            <Link href="/analyze/profile">Analyze</Link>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm border-cyan-200 bg-[#f7fbff]">
          <DialogHeader>
            <DialogTitle className={`${displayFont.className} text-slate-950`}>
              RepoLens
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}