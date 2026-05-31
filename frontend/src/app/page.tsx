"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bungee } from "next/font/google";
import { ArrowRight, GitBranch, Search, UserRound } from "lucide-react";

import { getPublicStats } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const displayFont = Bungee({
  subsets: ["latin"],
  weight: "400",
});

export default function HomePage() {
  const router = useRouter();

  const [repoUrl, setRepoUrl] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [repoAnalysisCount, setRepoAnalysisCount] = useState<number | null>(
    null
  );

  useEffect(() => {
    let active = true;

    getPublicStats()
      .then((stats) => {
        if (!active) return;
        setRepoAnalysisCount(stats.total_repo_analyses ?? 0);
      })
      .catch(() => {
        if (!active) return;
        setRepoAnalysisCount(0);
      });

    return () => {
      active = false;
    };
  }, []);

  function handleRepoAnalyze() {
    setError("");

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    router.push(`/analyze/repo?repoUrl=${encodeURIComponent(repoUrl.trim())}`);
  }

  function handleProfileAnalyze() {
    setError("");

    if (!username.trim()) {
      setError("Please enter a GitHub username.");
      return;
    }

    router.push(
      `/analyze/profile?username=${encodeURIComponent(
        username.trim()
      )}&maxRepos=5`
    );
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#f7fbff] px-4 py-8 text-slate-950 sm:min-h-[calc(100vh-5rem)] sm:px-6 sm:py-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-[-35%] top-[-14%] h-[320px] w-[320px] rounded-full bg-cyan-300/45 blur-[100px] sm:left-[-12%] sm:h-[440px] sm:w-[440px]" />
        <div className="absolute right-[-35%] top-[10%] h-[320px] w-[320px] rounded-full bg-emerald-300/45 blur-[100px] sm:right-[-10%] sm:h-[430px] sm:w-[430px]" />
        <div className="absolute bottom-[-18%] left-[20%] h-[300px] w-[300px] rounded-full bg-sky-300/35 blur-[110px] sm:left-[32%] sm:h-[380px] sm:w-[380px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:42px_42px] sm:bg-[size:48px_48px]" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col justify-center sm:min-h-[calc(100vh-10rem)]">
        <div className="mb-7 space-y-4 text-center sm:mb-10 sm:space-y-5">
          <p className="mx-auto max-w-3xl text-xs font-semibold tracking-[0.22em] text-slate-600 sm:text-sm sm:tracking-[0.35em]">
            SEE YOUR GITHUB THROUGH A RECRUITER&apos;S EYES
          </p>

          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-3xl border border-cyan-200/80 bg-white/70 px-5 py-4 shadow-[0_18px_60px_rgba(14,165,233,0.14)] backdrop-blur-2xl sm:w-fit sm:flex-row sm:gap-4 sm:px-6">
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 sm:text-xs">
                Repos Analyzed
              </p>

              <p className="bg-gradient-to-r from-cyan-500 via-sky-600 to-emerald-500 bg-clip-text text-3xl font-black leading-none text-transparent sm:text-4xl">
                {repoAnalysisCount === null
                  ? "..."
                  : (repoAnalysisCount+69).toLocaleString()}
              </p>
            </div>

            <div className="hidden h-12 w-px bg-slate-200 sm:block" />

            <p className="max-w-[230px] text-center text-xs leading-5 text-slate-500 sm:max-w-[190px] sm:text-left">
              Every successful repository analysis increases this count.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 lg:gap-7">
          <Card className="group h-full min-h-[300px] overflow-hidden border border-cyan-200/80 bg-white/70 text-slate-950 shadow-[0_20px_65px_rgba(14,165,233,0.16)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:bg-white/85 hover:shadow-[0_26px_75px_rgba(14,165,233,0.24)] sm:min-h-[310px]">
            <CardContent className="relative flex h-full flex-col justify-between p-5 sm:p-6">
              <div className="absolute right-[-55px] top-[-55px] h-28 w-28 rounded-full bg-cyan-300/35 blur-2xl sm:h-32 sm:w-32" />
              <div className="absolute bottom-[-65px] left-[-65px] h-32 w-32 rounded-full bg-sky-300/30 blur-2xl sm:h-36 sm:w-36" />

              <div className="relative space-y-4">
                <div className="flex items-end gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-700 shadow-lg shadow-cyan-500/30 ring-1 ring-white/80 sm:h-14 sm:w-14">
                    <GitBranch className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                  </div>

                  <div className="min-w-0">
                    <div className="mb-1 inline-flex rounded-full border border-cyan-300/70 bg-cyan-50/90 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 shadow-sm sm:text-xs">
                      Single Repo
                    </div>

                    <h2
                      className={`${displayFont.className} break-words pb-1 text-xl leading-tight tracking-wide text-slate-950 drop-shadow-[0_0_18px_rgba(34,211,238,0.30)] sm:whitespace-nowrap sm:text-2xl`}
                    >
                      Repository Analyzer
                    </h2>
                  </div>
                </div>

                <p className="max-w-md text-sm leading-5 text-slate-600">
                  Analyze one public repository and get its RepoLens score, weak
                  points, recruiter red flags, and improvement plan.
                </p>
              </div>

              <div className="relative mt-5 space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-700/70" />

                  <Input
                    className="h-11 border-cyan-200/90 bg-white/80 pl-11 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-300"
                    placeholder="https://github.com/username/repository"
                    value={repoUrl}
                    onChange={(event) => setRepoUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleRepoAnalyze();
                    }}
                  />
                </div>

                <Button
                  className="h-11 w-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-700 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-300 hover:via-sky-400 hover:to-blue-600"
                  onClick={handleRepoAnalyze}
                >
                  Analyze Repository
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="group h-full min-h-[300px] overflow-hidden border border-emerald-200/80 bg-white/70 text-slate-950 shadow-[0_20px_65px_rgba(16,185,129,0.16)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-white/85 hover:shadow-[0_26px_75px_rgba(16,185,129,0.24)] sm:min-h-[310px]">
            <CardContent className="relative flex h-full flex-col justify-between p-5 sm:p-6">
              <div className="absolute right-[-55px] top-[-55px] h-28 w-28 rounded-full bg-emerald-300/35 blur-2xl sm:h-32 sm:w-32" />
              <div className="absolute bottom-[-65px] left-[-65px] h-32 w-32 rounded-full bg-cyan-300/30 blur-2xl sm:h-36 sm:w-36" />

              <div className="relative space-y-4">
                <div className="flex items-end gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 via-cyan-400 to-sky-600 shadow-lg shadow-emerald-500/30 ring-1 ring-white/80 sm:h-14 sm:w-14">
                    <UserRound className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                  </div>

                  <div className="min-w-0">
                    <div className="mb-1 inline-flex rounded-full border border-emerald-300/70 bg-emerald-50/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-sm sm:text-xs">
                      Full GitHub Profile
                    </div>

                    <h2
                      className={`${displayFont.className} break-words pb-1 text-xl leading-tight tracking-wide text-slate-950 drop-shadow-[0_0_18px_rgba(52,211,153,0.30)] sm:whitespace-nowrap sm:text-2xl`}
                    >
                      Profile Analyzer
                    </h2>
                  </div>
                </div>

                <p className="max-w-md text-sm leading-5 text-slate-600">
                  Analyze a complete GitHub profile, detect developer type,
                  strongest skills, missing skills, best repo, and weakest repo.
                </p>
              </div>

              <div className="relative mt-5 space-y-3">
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700/70" />

                  <Input
                    className="h-11 border-emerald-200/90 bg-white/80 pl-11 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-300"
                    placeholder="GitHub username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleProfileAnalyze();
                    }}
                  />
                </div>

                <Button
                  className="h-11 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-300 hover:via-cyan-300 hover:to-sky-500"
                  onClick={handleProfileAnalyze}
                >
                  Analyze Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert className="mx-auto mt-6 max-w-xl border-red-200 bg-red-50 text-red-700 shadow-sm">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </section>
    </main>
  );
}