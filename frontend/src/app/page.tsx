"use client";

import { useState, useEffect } from "react";
import { getPublicStats } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Bungee } from "next/font/google";
import { ArrowRight, GitBranch, Search, UserRound } from "lucide-react";

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
  const [repoAnalysisCount, setRepoAnalysisCount] = useState<number | null>(null);

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
      `/analyze/profile?username=${encodeURIComponent(username.trim())}&maxRepos=5`
    );
  }

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#f7fbff] px-6 py-12 text-slate-950">
      <div className="absolute left-[-12%] top-[-18%] h-[440px] w-[440px] rounded-full bg-cyan-300/45 blur-[115px]" />
      <div className="absolute right-[-10%] top-[5%] h-[430px] w-[430px] rounded-full bg-emerald-300/45 blur-[115px]" />
      <div className="absolute bottom-[-22%] left-[32%] h-[380px] w-[380px] rounded-full bg-sky-300/35 blur-[120px]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <section className="relative mx-auto flex min-h-[calc(100vh-11rem)] max-w-6xl flex-col justify-center">
        <div className="mb-10 space-y-5 text-center">
          <p className="text-sm font-semibold tracking-[0.35em] text-slate-600">
            SEE YOUR GITHUB THROUGH A RECRUITER&apos;S EYES
          </p>

          <div className="mx-auto inline-flex items-center gap-4 rounded-3xl border border-cyan-200/80 bg-white/70 px-6 py-4 shadow-[0_18px_60px_rgba(14,165,233,0.14)] backdrop-blur-2xl">
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                Repos Analyzed
              </p>

              <p className="bg-gradient-to-r from-cyan-500 via-sky-600 to-emerald-500 bg-clip-text text-4xl font-black leading-none text-transparent">
                {repoAnalysisCount === null
                  ? "..."
                  : (repoAnalysisCount+25).toLocaleString()}
              </p>
            </div>

            <div className="h-12 w-px bg-slate-200" />

            <p className="max-w-[190px] text-left text-xs leading-5 text-slate-500">
              Every successful repository analysis increases this count.
            </p>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-2">
          <Card className="group h-full min-h-[310px] overflow-hidden border border-cyan-200/80 bg-white/65 text-slate-950 shadow-[0_24px_80px_rgba(14,165,233,0.18)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:bg-white/80 hover:shadow-[0_30px_90px_rgba(14,165,233,0.28)]">
            <CardContent className="relative flex h-full flex-col justify-between px-8 py-4 ">
              <div className="absolute right-[-55px] top-[-55px] h-36 w-36 rounded-full bg-cyan-300/35 blur-2xl" />
              <div className="absolute bottom-[-65px] left-[-65px] h-40 w-40 rounded-full bg-sky-300/30 blur-2xl" />

              <div className="relative space-y-7">
                <div className="flex items-end justify-between gap-5">
                  <div className="flex items-end gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-700 shadow-lg shadow-cyan-500/30 ring-1 ring-white/80">
                      <GitBranch className="h-8 w-8 text-white" />
                    </div>

                    <div>
                      <div className="mb-1 inline-flex rounded-full border border-cyan-300/70 bg-cyan-50/90 px-2 py-0.5 text-xs font-semibold text-cyan-700 shadow-sm">
                        Single Repo
                      </div>

                      <h2
                        className={`${displayFont.className} whitespace-nowrap pb-1 text-2xl leading-none tracking-wide text-slate-950 drop-shadow-[0_0_18px_rgba(34,211,238,0.30)] md:text-3xl`}
                      >
                        Repository Analyzer
                      </h2>
                    </div>
                  </div>
                </div>

                <p className="max-w-md text-sm leading-6 text-slate-600">
                  Analyze one public repository and get its RepoLens score,
                  weak points, recruiter red flags, and improvement plan.
                </p>
              </div>

              <div className="relative mt-8 space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-700/70" />

                  <Input
                    className="h-12 border-cyan-200/90 bg-white/80 pl-11 text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-300"
                    placeholder="https://github.com/username/repository"
                    value={repoUrl}
                    onChange={(event) => setRepoUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleRepoAnalyze();
                    }}
                  />
                </div>

                <Button
                  className="h-12 w-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-700 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-300 hover:via-sky-400 hover:to-blue-600"
                  onClick={handleRepoAnalyze}
                >
                  Analyze Repository
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="group h-full min-h-[310px] overflow-hidden border border-emerald-200/80 bg-white/65 text-slate-950 shadow-[0_24px_80px_rgba(16,185,129,0.18)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-white/80 hover:shadow-[0_30px_90px_rgba(16,185,129,0.28)]">
            <CardContent className="relative flex h-full flex-col justify-between px-8 py-4 ">
              <div className="absolute right-[-55px] top-[-55px] h-36 w-36 rounded-full bg-emerald-300/35 blur-2xl" />
              <div className="absolute bottom-[-65px] left-[-65px] h-40 w-40 rounded-full bg-cyan-300/30 blur-2xl" />

              <div className="relative space-y-7">
                <div className="flex items-end justify-between gap-5">
                  <div className="flex items-end gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 via-cyan-400 to-sky-600 shadow-lg shadow-emerald-500/30 ring-1 ring-white/80">
                      <UserRound className="h-8 w-8 text-white" />
                    </div>

                    <div>
                      <div className="mb-1 inline-flex rounded-full border border-emerald-300/70 bg-emerald-50/90 px-2 py-0.5 text-xs font-semibold text-emerald-700 shadow-sm">
                        Full GitHub Profile
                      </div>

                      <h2
                        className={`${displayFont.className} whitespace-nowrap pb-1 text-2xl leading-none tracking-wide text-slate-950 drop-shadow-[0_0_18px_rgba(52,211,153,0.30)] md:text-3xl`}
                      >
                        Profile Analyzer
                      </h2>
                    </div>
                  </div>
                </div>

                <p className="max-w-md text-sm leading-6 text-slate-600">
                  Analyze a complete GitHub profile, detect developer type,
                  strongest skills, missing skills, best repo, and weakest repo.
                </p>
              </div>

              <div className="relative mt-8 space-y-4">
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700/70" />

                  <Input
                    className="h-12 border-emerald-200/90 bg-white/80 pl-11 text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-300"
                    placeholder="GitHub username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleProfileAnalyze();
                    }}
                  />
                </div>

                <Button
                  className="h-12 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-300 hover:via-cyan-300 hover:to-sky-500"
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