"use client";

import { useEffect, useRef, useState } from "react";
import { Bungee } from "next/font/google";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  GitFork,
  Search,
  Star,
  Trophy,
  UserRound,
  XCircle,
} from "lucide-react";

import { analyzeProfile, analyzeRepo } from "@/lib/api";

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

type RepoCard = {
  name: string;
  full_name: string;
  url: string;
  description: string | null;
  main_language: string | null;
  stars: number;
  forks: number;
  overall_score: number;
  badge: string;
  strongest_category: string;
  weakest_category: string;
  has_readme: boolean;
  has_tests: boolean;
  has_dockerfile: boolean;
  has_ci_cd: boolean;
  has_live_demo: boolean;
};

type ProfileAnalysis = {
  profile: {
    username: string;
    name: string | null;
    avatar_url: string;
    html_url: string;
    bio: string | null;
    public_repos: number;
    followers: number;
    following: number;
    analyzed_repo_count: number;
  };
  scores: {
    overall: number;
    average_repo_score: number;
    best_repo_score: number;
    recruiter_readiness: number;
    production_readiness: number;
    documentation: number;
    activity: number;
    consistency: number;
    skill_diversity: number;
  };
  developer_type: string;
  skills: {
    strongest: string[];
    missing: string[];
    languages: string[];
    topics: string[];
  };
  best_repo: RepoCard | null;
  weakest_repo: RepoCard | null;
  repositories: RepoCard[];
  review: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    red_flags: string[];
    improvement_plan: string[];
  };
};

type RepoAnalysis = {
  repository: {
    name: string;
    full_name: string;
    url: string;
    description: string | null;
    main_language: string | null;
    stars: number;
    forks: number;
    open_issues: number;
  };
  scores: {
    overall: number;
    recruiter_readiness: number;
    production_readiness: number;
    documentation: number;
    code_structure: number;
    activity: number;
    consistency: number;
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

function normalizeProfileInput(value: string) {
  let input = value.trim();

  if (input.startsWith("@")) {
    input = input.slice(1);
  }

  if (input.includes("github.com")) {
    try {
      const url = new URL(input.startsWith("http") ? input : `https://${input}`);
      const username = url.pathname.split("/").filter(Boolean)[0];

      if (username) return username;
    } catch {
      return input;
    }
  }

  return input.replaceAll("/", "");
}

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

function FeatureBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        active
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

function ProfileScoreHero({ analysis }: { analysis: ProfileAnalysis }) {
  return (
    <Card className="relative overflow-hidden border border-emerald-200/80 bg-white/70 shadow-[0_30px_100px_rgba(16,185,129,0.22)] backdrop-blur-2xl">
      <div className="absolute left-[-80px] top-[-80px] h-56 w-56 rounded-full bg-cyan-300/45 blur-3xl" />
      <div className="absolute right-[-80px] bottom-[-80px] h-56 w-56 rounded-full bg-emerald-300/45 blur-3xl" />

      <CardContent className="relative grid gap-8 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 via-cyan-400 to-sky-600 p-2 shadow-[0_0_70px_rgba(16,185,129,0.45)]">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/80 bg-white/90 shadow-inner">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                Profile
              </p>

              <p
                className={`${displayFont.className} bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-600 bg-clip-text text-7xl leading-none text-transparent`}
              >
                {analysis.scores.overall}
              </p>

              <p className="text-sm font-semibold text-slate-500">out of 100</p>
            </div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
            <Trophy className="h-4 w-4" />
            Overall Profile Score
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <img
              src={analysis.profile.avatar_url}
              alt={analysis.profile.username}
              className="h-20 w-20 rounded-3xl border border-white/80 bg-white object-cover shadow-lg"
            />

            <div className="min-w-0 space-y-2">
              <Badge className="w-fit bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                {analysis.developer_type}
              </Badge>

              <h1
                className={`${displayFont.className} break-words text-3xl leading-tight tracking-wide text-slate-950 md:text-4xl`}
              >
                {analysis.profile.name || analysis.profile.username}
              </h1>

              <p className="text-sm font-medium text-slate-500">
                @{analysis.profile.username}
              </p>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            {analysis.profile.bio || "No GitHub bio found."}
          </p>

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="font-bold text-slate-950">
                {analysis.profile.public_repos}
              </p>
              <p className="text-slate-500">Public Repos</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="font-bold text-slate-950">
                {analysis.profile.followers}
              </p>
              <p className="text-slate-500">Followers</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="font-bold text-slate-950">
                {analysis.profile.analyzed_repo_count}
              </p>
              <p className="text-slate-500">Analyzed</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/65 p-5 shadow-sm">
            <p className="text-sm leading-6 text-slate-700">
              {analysis.review.summary}
            </p>
          </div>

          <Button
            asChild
            className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-300 hover:via-cyan-300 hover:to-sky-500"
          >
            <a href={analysis.profile.html_url} target="_blank" rel="noreferrer">
              Open GitHub Profile
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfileAnalyzerPage() {
  const [username, setUsername] = useState("");
  const [maxRepos, setMaxRepos] = useState(10);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [selectedRepoAnalysis, setSelectedRepoAnalysis] =
    useState<RepoAnalysis | null>(null);

  const [loading, setLoading] = useState(false);
  const [repoLoading, setRepoLoading] = useState("");
  const [error, setError] = useState("");

  const autoAnalyzed = useRef(false);

  useEffect(() => {
    if (autoAnalyzed.current) return;

    const params = new URLSearchParams(window.location.search);
    const usernameFromQuery = params.get("username");
    const maxReposFromQuery = Number(params.get("maxRepos") || "10");

    if (!usernameFromQuery) return;

    const normalizedUsername = normalizeProfileInput(usernameFromQuery);

    autoAnalyzed.current = true;
    setUsername(normalizedUsername);
    setMaxRepos(maxReposFromQuery);
    setError("");
    setAnalysis(null);
    setSelectedRepoAnalysis(null);
    setLoading(true);

    analyzeProfile(normalizedUsername, maxReposFromQuery)
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

  async function handleAnalyzeProfile() {
    setError("");
    setAnalysis(null);
    setSelectedRepoAnalysis(null);

    const normalizedUsername = normalizeProfileInput(username);

    if (!normalizedUsername) {
      setError("Please enter a GitHub username or profile URL.");
      return;
    }

    try {
      setLoading(true);
      const result = await analyzeProfile(normalizedUsername, maxRepos);
      setUsername(normalizedUsername);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewRepo(repoUrl: string) {
    setError("");
    setSelectedRepoAnalysis(null);

    try {
      setRepoLoading(repoUrl);
      const result = await analyzeRepo(repoUrl);
      setSelectedRepoAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Repo review failed.");
    } finally {
      setRepoLoading("");
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
              PROFILE ANALYZER
            </p>

            <h1
              className={`${displayFont.className} bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-600 bg-clip-text text-3xl leading-tight tracking-wide text-transparent md:text-5xl`}
            >
              See your GitHub through a recruiter&apos;s eyes.
            </h1>

            <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Enter your GitHub username or profile URL and get your overall
              developer score, recruiter-readiness score, strongest skills,
              missing skills, best repo, and weakest repo.
            </p>
          </div>
        )}

        {loading && (
          <Card className="mx-auto max-w-3xl overflow-hidden border border-emerald-200/80 bg-white/70 shadow-[0_30px_100px_rgba(16,185,129,0.18)] backdrop-blur-2xl">
            <CardContent className="flex flex-col items-center justify-center gap-5 p-10 text-center">
              <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 via-cyan-400 to-sky-600 shadow-lg shadow-emerald-500/25">
                <UserRound className="h-8 w-8 text-white" />
              </div>

              <div>
                <h1
                  className={`${displayFont.className} text-2xl tracking-wide text-slate-950`}
                >
                  Analyzing Profile
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  RepoLens is checking repositories, documentation, activity,
                  skill diversity, and recruiter-readiness signals.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {analysis && <ProfileScoreHero analysis={analysis} />}

        <Card className="mx-auto max-w-4xl overflow-hidden border border-emerald-200/80 bg-white/70 shadow-[0_24px_80px_rgba(16,185,129,0.16)] backdrop-blur-2xl">
          <CardContent className="p-6">
            <div className="grid gap-3 md:grid-cols-[1fr_130px_auto]">
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700/70" />

                <Input
                  className="h-12 border-emerald-200/90 bg-white/80 pl-11 text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-300"
                  placeholder="GitHub username or profile URL"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleAnalyzeProfile();
                  }}
                />
              </div>

              <Input
                type="number"
                min={1}
                max={30}
                className="h-12 border-emerald-200/90 bg-white/80 text-slate-950 shadow-sm focus-visible:border-emerald-400 focus-visible:ring-emerald-300"
                value={maxRepos}
                onChange={(event) => setMaxRepos(Number(event.target.value))}
              />

              <Button
                className="h-12 bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-600 px-7 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-300 hover:via-cyan-300 hover:to-sky-500"
                onClick={handleAnalyzeProfile}
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Analyze Profile"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Use the exact GitHub username from the profile URL. Example:
              github.com/vercel → enter vercel.
            </p>

            {error && (
              <Alert className="mt-5 border-red-200 bg-red-50 text-red-700 shadow-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {analysis && (
          <div className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border border-slate-200/80 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl">Profile Score Breakdown</CardTitle>
                </CardHeader>

                <CardContent className="grid gap-4 md:grid-cols-2">
                  <ScoreItem
                    label="Average Repo Score"
                    value={analysis.scores.average_repo_score}
                  />

                  <ScoreItem
                    label="Best Repo Score"
                    value={analysis.scores.best_repo_score}
                  />

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

                  <ScoreItem label="Activity" value={analysis.scores.activity} />

                  <ScoreItem
                    label="Consistency"
                    value={analysis.scores.consistency}
                  />

                  <ScoreItem
                    label="Skill Diversity"
                    value={analysis.scores.skill_diversity}
                  />
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
                <CardHeader>
                  <CardTitle className="text-xl">Skill Signals</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-bold text-emerald-800">
                      Strongest Skills
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {analysis.skills.strongest.length > 0 ? (
                        analysis.skills.strongest.map((skill) => (
                          <Badge
                            key={skill}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          No strong skills detected yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="font-bold text-orange-800">
                      Missing Skills
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {analysis.skills.missing.length > 0 ? (
                        analysis.skills.missing.map((skill) => (
                          <Badge
                            key={skill}
                            className="bg-orange-50 text-orange-700 hover:bg-orange-100"
                          >
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          No major missing skills detected.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border border-emerald-200 bg-emerald-50/70 shadow-[0_24px_80px_rgba(16,185,129,0.10)] backdrop-blur-2xl">
                <CardHeader>
                  <CardTitle className="text-emerald-800">Best Repo</CardTitle>
                </CardHeader>

                <CardContent>
                  {analysis.best_repo ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-bold text-slate-950">
                          {analysis.best_repo.name}
                        </h3>
                        <Badge>{analysis.best_repo.overall_score}/100</Badge>
                      </div>

                      <p className="text-sm leading-6 text-slate-700">
                        {analysis.best_repo.description ||
                          "No description found."}
                      </p>

                      <Button
                        onClick={() => handleReviewRepo(analysis.best_repo!.url)}
                        disabled={repoLoading === analysis.best_repo.url}
                        className="bg-gradient-to-r from-emerald-400 to-cyan-500 text-white"
                      >
                        {repoLoading === analysis.best_repo.url
                          ? "Reviewing..."
                          : "Review This Repo"}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No repo found.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-orange-200 bg-orange-50/70 shadow-[0_24px_80px_rgba(249,115,22,0.10)] backdrop-blur-2xl">
                <CardHeader>
                  <CardTitle className="text-orange-800">Weakest Repo</CardTitle>
                </CardHeader>

                <CardContent>
                  {analysis.weakest_repo ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-bold text-slate-950">
                          {analysis.weakest_repo.name}
                        </h3>
                        <Badge variant="secondary">
                          {analysis.weakest_repo.overall_score}/100
                        </Badge>
                      </div>

                      <p className="text-sm leading-6 text-slate-700">
                        {analysis.weakest_repo.description ||
                          "No description found."}
                      </p>

                      <Button
                        onClick={() =>
                          handleReviewRepo(analysis.weakest_repo!.url)
                        }
                        disabled={repoLoading === analysis.weakest_repo.url}
                        variant="outline"
                      >
                        {repoLoading === analysis.weakest_repo.url
                          ? "Reviewing..."
                          : "Review This Repo"}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No repo found.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border border-slate-200/80 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Profile Review</CardTitle>
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
                      7-Day Improvement Plan
                    </h3>

                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-cyan-900/80">
                      {analysis.review.improvement_plan.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Repository List</CardTitle>
              </CardHeader>

              <CardContent className="grid gap-4">
                {analysis.repositories.map((repo) => (
                  <Card
                    key={repo.full_name}
                    className="border border-slate-200/80 bg-white/75 shadow-sm"
                  >
                    <CardContent className="space-y-4 p-5">
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-950">
                              {repo.name}
                            </h3>

                            <Badge>{repo.overall_score}/100</Badge>
                            <Badge variant="secondary">{repo.badge}</Badge>
                          </div>

                          <p className="text-sm leading-6 text-slate-600">
                            {repo.description || "No description found."}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              {repo.main_language || "Unknown"}
                            </Badge>

                            <Badge variant="secondary" className="gap-1">
                              <Star className="h-3.5 w-3.5" />
                              {repo.stars}
                            </Badge>

                            <Badge variant="secondary" className="gap-1">
                              <GitFork className="h-3.5 w-3.5" />
                              {repo.forks}
                            </Badge>

                            <Badge variant="outline">
                              Strongest:{" "}
                              {formatCategory(repo.strongest_category)}
                            </Badge>

                            <Badge variant="outline">
                              Weakest: {formatCategory(repo.weakest_category)}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleReviewRepo(repo.url)}
                          disabled={repoLoading === repo.url}
                          className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-600 text-white"
                        >
                          {repoLoading === repo.url
                            ? "Reviewing..."
                            : "Review This Repo"}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <FeatureBadge label="README" active={repo.has_readme} />
                        <FeatureBadge label="Tests" active={repo.has_tests} />
                        <FeatureBadge
                          label="Docker"
                          active={repo.has_dockerfile}
                        />
                        <FeatureBadge label="CI/CD" active={repo.has_ci_cd} />
                        <FeatureBadge
                          label="Live Demo"
                          active={repo.has_live_demo}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {selectedRepoAnalysis && (
              <Card className="border border-cyan-200/80 bg-white/70 shadow-[0_24px_80px_rgba(14,165,233,0.12)] backdrop-blur-2xl">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-xl">
                      Repo Review: {selectedRepoAnalysis.repository.name}
                    </CardTitle>

                    <Badge>{selectedRepoAnalysis.scores.badge}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-[0.45fr_1fr] lg:items-center">
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-cyan-200 bg-cyan-50/70 p-6 text-center">
                      <p className="text-sm font-semibold text-cyan-700">
                        RepoLens Score
                      </p>

                      <p
                        className={`${displayFont.className} bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-6xl leading-none text-transparent`}
                      >
                        {selectedRepoAnalysis.scores.overall}
                      </p>

                      <p className="text-sm text-slate-500">out of 100</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <ScoreItem
                        label="Recruiter Readiness"
                        value={
                          selectedRepoAnalysis.scores.recruiter_readiness
                        }
                      />

                      <ScoreItem
                        label="Production Readiness"
                        value={
                          selectedRepoAnalysis.scores.production_readiness
                        }
                      />

                      <ScoreItem
                        label="Documentation"
                        value={selectedRepoAnalysis.scores.documentation}
                      />

                      <ScoreItem
                        label="Code Structure"
                        value={selectedRepoAnalysis.scores.code_structure}
                      />
                    </div>
                  </div>

                  <Separator />

                  <p className="text-sm leading-6 text-slate-700">
                    {selectedRepoAnalysis.review.summary}
                  </p>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
                      <h3 className="mb-3 font-bold text-emerald-800">
                        Strengths
                      </h3>

                      <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-emerald-900/80">
                        {selectedRepoAnalysis.review.strengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-3xl border border-orange-200 bg-orange-50/70 p-5">
                      <h3 className="mb-3 font-bold text-orange-800">
                        Weaknesses
                      </h3>

                      <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-orange-900/80">
                        {selectedRepoAnalysis.review.weaknesses.map((item) => (
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
                      {selectedRepoAnalysis.review.interview_talking_points.map(
                        (item) => (
                          <li key={item}>{item}</li>
                        )
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </section>
    </main>
  );
}