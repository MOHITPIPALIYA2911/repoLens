import Image from "next/image";
import Link from "next/link";
import { Bungee } from "next/font/google";
import { GitBranch, Scale, Trophy, UserRound } from "lucide-react";

const displayFont = Bungee({
  subsets: ["latin"],
  weight: "400",
});

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-white/85 backdrop-blur-xl">
      <div className="pointer-events-none absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] bottom-[-120px] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/brand/repolens-logo.png"
                alt="RepoLens Logo"
                width={210}
                height={70}
                className="h-14 w-auto object-contain"
              />
            </Link>

            <p className="max-w-md text-sm leading-6 text-slate-600">
              RepoLens helps developers analyze, compare, and improve GitHub
              repositories and profiles from a recruiter&apos;s point of view.
            </p>

            <p className="text-xs font-semibold tracking-[0.25em] text-slate-500">
              SEE YOUR GITHUB THROUGH A RECRUITER&apos;S EYES
            </p>
          </div>

          <div className="space-y-4">
            <h3
              className={`${displayFont.className} text-sm tracking-wide text-slate-700`}
            >
              Analyze
            </h3>

            <div className="grid gap-3 text-sm">
              <Link
                href="/analyze/repo"
                className="flex items-center gap-2 text-slate-600 transition hover:text-cyan-600"
              >
                <GitBranch className="h-4 w-4" />
                Repository Analyzer
              </Link>

              <Link
                href="/analyze/profile"
                className="flex items-center gap-2 text-slate-600 transition hover:text-emerald-600"
              >
                <UserRound className="h-4 w-4" />
                Profile Analyzer
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3
              className={`${displayFont.className} text-sm tracking-wide text-slate-700`}
            >
              Explore
            </h3>

            <div className="grid gap-3 text-sm">
              <Link
                href="/compare/repo"
                className="flex items-center gap-2 text-slate-600 transition hover:text-cyan-600"
              >
                <Scale className="h-4 w-4" />
                Repo Comparison
              </Link>

              <Link
                href="/leaderboard"
                className="flex items-center gap-2 text-slate-600 transition hover:text-emerald-600"
              >
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 md:flex-row md:items-center">
          <p>
            © {year} RepoLens. Built by{" "}
            <a
              href="https://mohitpipaliya.me"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-cyan-600 transition hover:text-emerald-600"
            >
              Mohit Pipaliya
            </a>
            .
          </p>

          <p>
            Made with{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text font-semibold text-transparent">
              AI-powered GitHub analysis
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}