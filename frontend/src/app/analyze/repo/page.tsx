"use client";

import { useEffect, useRef, useState } from "react";
import { Bungee } from "next/font/google";
import { RepoFeedbackCard } from "@/components/repo-feedback-card";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  GitFork,
  Search,
  Star,
  Trophy,
  XCircle,
} from "lucide-react";

import { analyzeRepo } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const displayFont = Bungee({
  subsets: ["latin"],
  weight: "400",
});

type RepoAnalysis = {
  repository: {
    name: string;
    full_name: string;
    owner: string;
    repo: string;
    url: string;
    description: string | null;
    main_language: string | null;
    stars: number;
    forks: number;
    open_issues: number;
    default_branch: string;
  };
  features: Record<string, string | number | boolean | string[] | null>;
  scores: {
    overall: number;
    recruiter_readiness: number;
    production_readiness: number;
    documentation: number;
    code_structure: number;
    activity: number;
    consistency: number;
    strongest_category: string;
    weakest_category: string;
    badge: string;
  };
  review: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    red_flags: string[];
    improvement_plan: string[];
    interview_talking_points: string[];
  };
};

function formatCategory(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-sm font-bold text-slate-950">{value}/100</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

function BooleanCheck({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
        }`}
    >
      {active ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {label}
    </div>
  );
}

function ScoreHero({ analysis }: { analysis: RepoAnalysis }) {
  return (
    <Card className="relative overflow-hidden border border-cyan-200/80 bg-white/70 shadow-[0_30px_100px_rgba(14,165,233,0.22)] backdrop-blur-2xl">
      <div className="absolute left-[-80px] top-[-80px] h-56 w-56 rounded-full bg-cyan-300/45 blur-3xl" />
      <div className="absolute right-[-80px] bottom-[-80px] h-56 w-56 rounded-full bg-emerald-300/45 blur-3xl" />

      <CardContent className="relative grid gap-8 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 via-sky-500 to-emerald-400 p-2 shadow-[0_0_70px_rgba(14,165,233,0.45)]">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/80 bg-white/90 shadow-inner">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                Overall
              </p>

              <p
                className={`${displayFont.className} bg-gradient-to-r from-cyan-500 via-sky-600 to-emerald-500 bg-clip-text text-7xl leading-none text-transparent`}
              >
                {analysis.scores.overall}
              </p>

              <p className="text-sm font-semibold text-slate-500">out of 100</p>
            </div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700 shadow-sm">
            <Trophy className="h-4 w-4" />
            {analysis.scores.badge}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Badge className="w-fit bg-gradient-to-r from-cyan-500 to-emerald-500 text-white">
              Overall RepoLens Score
            </Badge>

            <h1
              className={`${displayFont.className} text-3xl leading-tight tracking-wide text-slate-950 md:text-4xl`}
            >
              {analysis.repository.name}
            </h1>

            <p className="text-sm font-medium text-slate-500">
              {analysis.repository.full_name}
            </p>

            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              {analysis.repository.description || "No repository description found."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              {analysis.repository.main_language || "Unknown"}
            </Badge>

            <Badge variant="secondary" className="gap-1.5">
              <Star className="h-3.5 w-3.5" />
              {analysis.repository.stars} Stars
            </Badge>

            <Badge variant="secondary" className="gap-1.5">
              <GitFork className="h-3.5 w-3.5" />
              {analysis.repository.forks} Forks
            </Badge>

            <Badge variant="secondary">
              Strongest: {formatCategory(analysis.scores.strongest_category)}
            </Badge>

            <Badge variant="outline">
              Weakest: {formatCategory(analysis.scores.weakest_category)}
            </Badge>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/65 p-5 shadow-sm">
            <p className="text-sm leading-6 text-slate-700">
              {analysis.review.summary}
            </p>
          </div>

          <Button
            asChild
            className="bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-300 hover:via-sky-400 hover:to-emerald-400"
          >
            <a href={analysis.repository.url} target="_blank" rel="noreferrer">
              Open Repository
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RepoAnalyzerPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const autoAnalyzed = useRef(false);

  useEffect(() => {
    if (autoAnalyzed.current) return;

    const params = new URLSearchParams(window.location.search);
    const repoUrlFromQuery = params.get("repoUrl");

    if (!repoUrlFromQuery) return;

    autoAnalyzed.current = true;
    setRepoUrl(repoUrlFromQuery);
    setError("");
    setLoading(true);

    analyzeRepo(repoUrlFromQuery)
      .then((result) => {
        setAnalysis(result);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function handleAnalyze() {
    setError("");
    setAnalysis(null);

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    try {
      setLoading(true);
      const result = await analyzeRepo(repoUrl.trim());
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#f7fbff] px-6 py-12 text-slate-950">
      <div className="absolute left-[-12%] top-[-18%] h-[440px] w-[440px] rounded-full bg-cyan-300/45 blur-[115px]" />
      <div className="absolute right-[-10%] top-[5%] h-[430px] w-[430px] rounded-full bg-emerald-300/45 blur-[115px]" />
      <div className="absolute bottom-[-22%] left-[32%] h-[380px] w-[380px] rounded-full bg-sky-300/35 blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <section className="relative mx-auto max-w-7xl space-y-8">
        {!analysis && !loading && (
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <p className="text-sm font-semibold tracking-[0.35em] text-slate-600">
              REPOSITORY ANALYZER
            </p>

            <h1
              className={`${displayFont.className} bg-gradient-to-r from-cyan-500 via-sky-600 to-emerald-500 bg-clip-text text-3xl leading-tight tracking-wide text-transparent md:text-5xl`}
            >
              See your GitHub through a recruiter&apos;s eyes.
            </h1>

            <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Enter a public GitHub repository URL and get instant scores for
              documentation, production readiness, recruiter readiness, activity,
              and code structure.
            </p>
          </div>
        )}

        {loading && (
          <Card className="mx-auto max-w-3xl overflow-hidden border border-cyan-200/80 bg-white/70 shadow-[0_30px_100px_rgba(14,165,233,0.18)] backdrop-blur-2xl">
            <CardContent className="flex flex-col items-center justify-center gap-5 p-10 text-center">
              <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-500 to-emerald-400 shadow-lg shadow-cyan-500/25">
                <Search className="h-8 w-8 text-white" />
              </div>

              <div>
                <h1
                  className={`${displayFont.className} text-2xl tracking-wide text-slate-950`}
                >
                  Analyzing Repository
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  RepoLens is checking README, files, structure, activity, and
                  recruiter-readiness signals.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {analysis && <ScoreHero analysis={analysis} />}

        <Card className="mx-auto max-w-4xl overflow-hidden border border-cyan-200/80 bg-white/70 shadow-[0_24px_80px_rgba(14,165,233,0.16)] backdrop-blur-2xl">
          <CardContent className="p-6">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-700/70" />

                <Input
                  className="h-12 border-cyan-200/90 bg-white/80 pl-11 text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-300"
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleAnalyze();
                  }}
                />
              </div>

              <Button
                className="h-12 bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-500 px-7 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-300 hover:via-sky-400 hover:to-emerald-400"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Analyze Repo"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>

            {error && (
              <Alert className="mt-5 border-red-200 bg-red-50 text-red-700 shadow-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {analysis && (
          <RepoFeedbackCard
            key={analysis.repository.url}
            analysis={analysis}
          />
        )}
        {analysis && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border border-slate-200/80 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-xl">Repository Details</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border bg-white/70 p-4">
                    <p className="text-slate-500">Language</p>
                    <p className="font-bold text-slate-950">
                      {analysis.repository.main_language || "Unknown"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-white/70 p-4">
                    <p className="text-slate-500">Stars</p>
                    <p className="font-bold text-slate-950">
                      {analysis.repository.stars}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-white/70 p-4">
                    <p className="text-slate-500">Forks</p>
                    <p className="font-bold text-slate-950">
                      {analysis.repository.forks}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-white/70 p-4">
                    <p className="text-slate-500">Issues</p>
                    <p className="font-bold text-slate-950">
                      {analysis.repository.open_issues}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-950">
                    Detected Signals
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <BooleanCheck
                      label="README"
                      active={Boolean(analysis.features.has_readme)}
                    />
                    <BooleanCheck
                      label="Screenshots"
                      active={Boolean(analysis.features.has_screenshots)}
                    />
                    <BooleanCheck
                      label="Setup Guide"
                      active={Boolean(analysis.features.has_setup_guide)}
                    />
                    <BooleanCheck
                      label="Live Demo"
                      active={Boolean(analysis.features.has_live_demo)}
                    />
                    <BooleanCheck
                      label="Tests"
                      active={Boolean(analysis.features.has_tests)}
                    />
                    <BooleanCheck
                      label="Docker"
                      active={Boolean(analysis.features.has_dockerfile)}
                    />
                    <BooleanCheck
                      label="CI/CD"
                      active={Boolean(analysis.features.has_ci_cd)}
                    />
                    <BooleanCheck
                      label="License"
                      active={Boolean(analysis.features.has_license)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl">Score Breakdown</CardTitle>
              </CardHeader>

              <CardContent className="grid gap-4 md:grid-cols-2">
                <ScoreItem
                  label="Recruiter Readiness"
                  value={analysis.scores.recruiter_readiness}
                />
                <ScoreItem
                  label="Production Readiness"
                  value={analysis.scores.production_readiness}
                />
                <ScoreItem
                  label="Documentation"
                  value={analysis.scores.documentation}
                />
                <ScoreItem
                  label="Code Structure"
                  value={analysis.scores.code_structure}
                />
                <ScoreItem label="Activity" value={analysis.scores.activity} />
                <ScoreItem
                  label="Consistency"
                  value={analysis.scores.consistency}
                />
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-xl">RepoLens Review</CardTitle>
              </CardHeader>

              <CardContent className="space-y-7">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
                    <h3 className="mb-3 font-bold text-emerald-800">
                      Strengths
                    </h3>

                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-emerald-900/80">
                      {analysis.review.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-orange-200 bg-orange-50/70 p-5">
                    <h3 className="mb-3 font-bold text-orange-800">
                      Weaknesses
                    </h3>

                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-orange-900/80">
                      {analysis.review.weaknesses.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-red-200 bg-red-50/70 p-5">
                    <h3 className="mb-3 font-bold text-red-800">
                      Recruiter Red Flags
                    </h3>

                    {analysis.review.red_flags.length > 0 ? (
                      <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-red-900/80">
                        {analysis.review.red_flags.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-red-900/70">
                        No major red flags found.
                      </p>
                    )}
                  </div>

                  <div className="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-5">
                    <h3 className="mb-3 font-bold text-cyan-800">
                      Improvement Plan
                    </h3>

                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-cyan-900/80">
                      {analysis.review.improvement_plan.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/70 p-5">
                  <h3 className="mb-3 font-bold text-slate-950">
                    Interview Talking Points
                  </h3>

                  <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                    {analysis.review.interview_talking_points.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </main>
  );
}