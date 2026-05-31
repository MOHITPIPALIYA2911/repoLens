"use client";

import { useEffect, useRef, useState } from "react";
import { Bungee } from "next/font/google";
import { ArrowRight, GitBranch, Scale } from "lucide-react";

import { compareRepos } from "@/lib/api";
import {
  RepoComparisonResult,
  type RepoCompareResult,
} from "@/components/repo-comparison-result";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const displayFont = Bungee({
  subsets: ["latin"],
  weight: "400",
});

export default function RepoComparePage() {
  const [repoAUrl, setRepoAUrl] = useState("");
  const [repoBUrl, setRepoBUrl] = useState("");
  const [result, setResult] = useState<RepoCompareResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const autoCompared = useRef(false);

  useEffect(() => {
    if (autoCompared.current) return;

    const params = new URLSearchParams(window.location.search);
    const repoA = params.get("repoA");
    const repoB = params.get("repoB");

    if (!repoA || !repoB) return;

    autoCompared.current = true;
    setRepoAUrl(repoA);
    setRepoBUrl(repoB);
    runCompare(repoA, repoB);
  }, []);

  async function runCompare(firstRepoUrl: string, secondRepoUrl: string) {
    setError("");
    setResult(null);

    try {
      setLoading(true);
      const comparison = await compareRepos(firstRepoUrl, secondRepoUrl);
      setResult(comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleCompare() {
    if (!repoAUrl.trim()) {
      setError("Please enter first repository URL.");
      return;
    }

    if (!repoBUrl.trim()) {
      setError("Please enter second repository URL.");
      return;
    }

    runCompare(repoAUrl.trim(), repoBUrl.trim());
  }

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#f7fbff] px-6 py-12 text-slate-950">
      <div className="absolute left-[-12%] top-[-18%] h-[440px] w-[440px] rounded-full bg-cyan-300/45 blur-[115px]" />
      <div className="absolute right-[-10%] top-[5%] h-[430px] w-[430px] rounded-full bg-emerald-300/45 blur-[115px]" />
      <div className="absolute bottom-[-22%] left-[32%] h-[380px] w-[380px] rounded-full bg-sky-300/35 blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <section className="relative mx-auto max-w-7xl space-y-8">
        {!result && !loading && (
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <p className="text-sm font-semibold tracking-[0.35em] text-slate-600">
              REPOSITORY COMPARISON
            </p>

            <h1
              className={`${displayFont.className} bg-gradient-to-r from-cyan-500 via-sky-600 to-emerald-500 bg-clip-text text-3xl leading-tight tracking-wide text-transparent md:text-5xl`}
            >
              Compare two GitHub repos.
            </h1>

            <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Compare scores, missing features, production-readiness,
              documentation quality, recruiter-readiness, and improvement plans.
            </p>
          </div>
        )}

        {loading && (
          <Card className="mx-auto max-w-3xl overflow-hidden border border-cyan-200/80 bg-white/70 shadow-[0_30px_100px_rgba(14,165,233,0.18)] backdrop-blur-2xl">
            <CardContent className="flex flex-col items-center justify-center gap-5 p-10 text-center">
              <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-500 to-emerald-400 shadow-lg shadow-cyan-500/25">
                <Scale className="h-8 w-8 text-white" />
              </div>

              <div>
                <h1
                  className={`${displayFont.className} text-2xl tracking-wide text-slate-950`}
                >
                  Comparing Repositories
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                  RepoLens is checking scores, structure, README, files, and
                  missing signals.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mx-auto max-w-5xl overflow-hidden border border-cyan-200/80 bg-white/70 shadow-[0_24px_80px_rgba(14,165,233,0.16)] backdrop-blur-2xl">
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-700">First Repo</p>

                <div className="relative">
                  <GitBranch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-700/70" />

                  <Input
                    className="h-12 border-cyan-200/90 bg-white/80 pl-11 text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-300"
                    placeholder="https://github.com/owner/repo-a"
                    value={repoAUrl}
                    onChange={(event) => setRepoAUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleCompare();
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-700">Second Repo</p>

                <div className="relative">
                  <GitBranch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700/70" />

                  <Input
                    className="h-12 border-emerald-200/90 bg-white/80 pl-11 text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-300"
                    placeholder="https://github.com/owner/repo-b"
                    value={repoBUrl}
                    onChange={(event) => setRepoBUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleCompare();
                    }}
                  />
                </div>
              </div>
            </div>

            <Button
              className="h-12 w-full bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-300 hover:via-sky-400 hover:to-emerald-400"
              onClick={handleCompare}
              disabled={loading}
            >
              {loading ? "Comparing..." : "Compare Repositories"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>

            {error && (
              <Alert className="border-red-200 bg-red-50 text-red-700 shadow-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {result && (
          <RepoComparisonResult
            result={result}
            leftTitle="First Repo"
            rightTitle="Second Repo"
          />
        )}
      </section>
    </main>
  );
}