"use client";

import { useEffect, useState } from "react";
import { Bungee } from "next/font/google";
import {
    ArrowRight,
    Code2,
    ExternalLink,
    GitBranch,
    GitFork,
    Lock,
    LockOpen,
    Search,
    Star,
    Trash2,
    Trophy,
} from "lucide-react";

import {
    compareRepos,
    deleteLeaderboardItem,
    getLeaderboard,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
    RepoComparisonResult,
    type RepoCompareResult,
} from "@/components/repo-comparison-result";

const displayFont = Bungee({
    subsets: ["latin"],
    weight: "400",
});

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_LEADERBOARD_ADMIN_PASSWORD || "";

type LeaderboardItem = {
    rank: number;
    name: string;
    full_name: string;
    owner: string;
    repo: string;
    url: string;
    description: string | null;
    main_language: string | null;
    stars: number;
    forks: number;
    average_score: number;
    overall_score: number;
    recruiter_readiness: number;
    production_readiness: number;
    documentation: number;
    code_structure: number;
    activity: number;
    consistency: number;
    strongest_category: string;
    weakest_category: string;
    badge: string;
    has_readme: boolean;
    has_screenshots: boolean;
    has_setup_guide: boolean;
    has_live_demo: boolean;
    has_tests: boolean;
    has_dockerfile: boolean;
    has_ci_cd: boolean;
    has_license: boolean;
    analyzed_at: string;
};

type CompareResult = {
    repo_a: {
        repository: {
            name: string;
            full_name: string;
            url: string;
        };
        scores: Record<string, number | string>;
    };
    repo_b: {
        repository: {
            name: string;
            full_name: string;
            url: string;
        };
        scores: Record<string, number | string>;
    };
    winners: Record<
        string,
        {
            label: string;
            repo_a_score: number;
            repo_b_score: number;
            winner: "repo_a" | "repo_b" | "tie";
            difference: number;
        }
    >;
    overall_winner: {
        winner: "repo_a" | "repo_b" | "tie";
        winner_name: string;
        repo_a_score: number;
        repo_b_score: number;
        difference: number;
    };
    missing_for_a: string[];
    missing_for_b: string[];
    review: {
        summary: string;
        improvement_for_a: string[];
        improvement_for_b: string[];
    };
};

function formatCategory(value: string) {
    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ScoreLine({
    label,
    left,
    right,
}: {
    label: string;
    left: number;
    right: number;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <span className="text-sm font-bold text-slate-950">
                    {left} vs {right}
                </span>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
                <Progress value={left} className="h-2" />
                <Progress value={right} className="h-2" />
            </div>
        </div>
    );
}

export default function LeaderboardPage() {
    const [items, setItems] = useState<LeaderboardItem[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<LeaderboardItem | null>(null);
    const [userRepoUrl, setUserRepoUrl] = useState("");
    const [compareResult, setCompareResult] = useState<RepoCompareResult | null>(null);

    const [loading, setLoading] = useState(true);
    const [compareLoading, setCompareLoading] = useState(false);
    const [error, setError] = useState("");
    const [compareError, setCompareError] = useState("");

    const [adminUnlocked, setAdminUnlocked] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [deleteLoadingUrl, setDeleteLoadingUrl] = useState("");

    async function loadLeaderboard() {
        setError("");

        try {
            setLoading(true);
            const result = await getLeaderboard(10);
            setItems(result.items || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Leaderboard failed.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadLeaderboard();
    }, []);

    async function handleCompare() {
        setCompareError("");
        setCompareResult(null);

        if (!selectedRepo) return;

        if (!userRepoUrl.trim()) {
            setCompareError("Please enter your GitHub repository URL.");
            return;
        }

        try {
            setCompareLoading(true);

            const result = await compareRepos(selectedRepo.url, userRepoUrl.trim());

            setCompareResult(result);
            await loadLeaderboard();
        } catch (err) {
            setCompareError(err instanceof Error ? err.message : "Comparison failed.");
        } finally {
            setCompareLoading(false);
        }
    }

    function handleAdminLockClick() {
        if (adminUnlocked) {
            setAdminUnlocked(false);
            return;
        }

        setPasswordInput("");
        setPasswordError("");
        setPasswordDialogOpen(true);
    }

    function handleUnlockAdmin() {
        if (!ADMIN_PASSWORD) {
            setPasswordError("Admin password is not configured.");
            return;
        }

        if (passwordInput === ADMIN_PASSWORD) {
            setAdminUnlocked(true);
            setPasswordDialogOpen(false);
            setPasswordInput("");
            setPasswordError("");
            return;
        }

        setPasswordError("Invalid password.");
    }

    async function handleDeleteLeaderboardItem(item: LeaderboardItem) {
        const confirmed = window.confirm(
            `Delete ${item.full_name} from leaderboard?`
        );

        if (!confirmed) return;

        try {
            setDeleteLoadingUrl(item.url);

            await deleteLeaderboardItem(item.url, ADMIN_PASSWORD);

            setItems((currentItems) =>
                currentItems
                    .filter((repo) => repo.url !== item.url)
                    .map((repo, index) => ({
                        ...repo,
                        rank: index + 1,
                    }))
            );

            await loadLeaderboard();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed.");
        } finally {
            setDeleteLoadingUrl("");
        }
    }

    return (
        <main className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden bg-[#f7fbff] px-6 py-12 text-slate-950">
            <div className="pointer-events-none absolute inset-0 z-0">
                <div className="absolute left-[-12%] top-[-18%] h-[440px] w-[440px] rounded-full bg-cyan-300/45 blur-[115px]" />
                <div className="absolute right-[-10%] top-[5%] h-[430px] w-[430px] rounded-full bg-emerald-300/45 blur-[115px]" />
                <div className="absolute bottom-[-22%] left-[32%] h-[380px] w-[380px] rounded-full bg-sky-300/35 blur-[120px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>

            <section className="relative z-10 mx-auto max-w-7xl space-y-8">
                <div className="mx-auto max-w-3xl space-y-4 text-center">
                    <p className="text-sm font-semibold tracking-[0.35em] text-slate-600">
                        REPOLENS LEADERBOARD
                    </p>

                    <h1
                        className={`${displayFont.className} bg-gradient-to-r from-cyan-500 via-sky-600 to-emerald-500 bg-clip-text text-3xl leading-tight tracking-wide text-transparent md:text-5xl`}
                    >
                        Top scored repositories.
                    </h1>

                    <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                        Repositories are ranked by the average of recruiter readiness,
                        production readiness, documentation, code structure, activity, and
                        consistency scores.
                    </p>
                </div>
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        onClick={handleAdminLockClick}
                        className={`h-9 w-9 rounded-full p-0 transition ${adminUnlocked
                            ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            : "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                            }`}
                        title={adminUnlocked ? "Lock admin mode" : "Unlock admin mode"}
                    >
                        {adminUnlocked ? (
                            <LockOpen className="h-4 w-4" />
                        ) : (
                            <Lock className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {error && (
                    <Alert className="mx-auto max-w-3xl border-red-200 bg-red-50 text-red-700 shadow-sm">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading && (
                    <Card className="mx-auto max-w-3xl border border-cyan-200/80 bg-white/70 shadow-[0_30px_100px_rgba(14,165,233,0.18)] backdrop-blur-2xl">
                        <CardContent className="flex flex-col items-center justify-center gap-5 p-10 text-center">
                            <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-500 to-emerald-400 shadow-lg shadow-cyan-500/25">
                                <Trophy className="h-8 w-8 text-white" />
                            </div>

                            <div>
                                <h2
                                    className={`${displayFont.className} text-2xl tracking-wide text-slate-950`}
                                >
                                    Loading Leaderboard
                                </h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    Fetching top repositories from RepoLens analysis history.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!loading && items.length === 0 && (
                    <Card className="mx-auto max-w-3xl border border-cyan-200/80 bg-white/70 shadow-[0_30px_100px_rgba(14,165,233,0.18)] backdrop-blur-2xl">
                        <CardContent className="space-y-5 p-8 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-500 to-emerald-400">
                                <Search className="h-8 w-8 text-white" />
                            </div>

                            <div className="space-y-2">
                                <h2
                                    className={`${displayFont.className} text-2xl tracking-wide text-slate-950`}
                                >
                                    Leaderboard is empty
                                </h2>

                                <p className="text-sm leading-6 text-slate-600">
                                    Analyze a few repositories first. Every analyzed repository is
                                    automatically added to the leaderboard.
                                </p>
                            </div>

                            <Button
                                asChild
                                className="bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-500 text-white"
                            >
                                <a href="/analyze/repo">
                                    Analyze Repository
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {!loading && items.length > 0 && (
                    <div className="grid gap-5">
                        {items.map((item) => (
                            <Card
                                key={item.url}
                                className="group relative overflow-hidden border border-slate-200/80 bg-white/95 shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition duration-200 hover:border-cyan-300/80 hover:shadow-[0_22px_65px_rgba(14,165,233,0.16)]"
                            >
                                <CardContent className="p-6">
                                    <div className="grid gap-6 lg:grid-cols-[100px_1fr_240px] lg:items-center">
                                        <div className="flex items-center gap-4 lg:block lg:text-center">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-300 via-sky-500 to-emerald-400 shadow-lg shadow-cyan-500/25 lg:mx-auto">
                                                <span
                                                    className={`${displayFont.className} text-2xl text-white`}
                                                >
                                                    #{item.rank}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-xl font-bold text-slate-950">
                                                    {item.name}
                                                </h2>

                                                <Badge>{item.overall_score}/100</Badge>
                                                <Badge variant="secondary">{item.badge}</Badge>
                                            </div>

                                            <p className="text-sm font-medium text-slate-500">
                                                {item.full_name}
                                            </p>

                                            <p className="max-w-3xl text-sm leading-6 text-slate-600">
                                                {item.description || "No description found."}
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary" className="gap-1">
                                                    <Code2 className="h-3.5 w-3.5" />
                                                    {item.main_language || "Unknown"}
                                                </Badge>

                                                <Badge variant="secondary" className="gap-1">
                                                    <Star className="h-3.5 w-3.5" />
                                                    {item.stars}
                                                </Badge>

                                                <Badge variant="secondary" className="gap-1">
                                                    <GitFork className="h-3.5 w-3.5" />
                                                    {item.forks}
                                                </Badge>

                                                <Badge variant="outline">
                                                    Strongest: {formatCategory(item.strongest_category)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 text-center">
                                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-700">
                                                    Score
                                                </p>

                                                <p
                                                    className={`${displayFont.className} bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-5xl leading-none text-transparent`}
                                                >
                                                    {item.overall_score}
                                                </p>

                                                <p className="text-xs text-slate-500">RepoLens score</p>
                                                {/* <Badge variant="outline">Avg: {item.average_score}/100</Badge> */}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedRepo(item);
                                                        setUserRepoUrl("");
                                                        setCompareResult(null);
                                                        setCompareError("");
                                                    }}
                                                    className="bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-500 text-white"
                                                >
                                                    Compare
                                                </Button>

                                                <Button asChild variant="outline">
                                                    <a href={item.url} target="_blank" rel="noreferrer">
                                                        github
                                                        <ExternalLink className="ml-2 h-4 w-4" />
                                                    </a>
                                                </Button>

                                                {adminUnlocked && (
                                                    <Button
                                                        variant="outline"
                                                        disabled={deleteLoadingUrl === item.url}
                                                        onClick={() => handleDeleteLeaderboardItem(item)}
                                                        className="col-span-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    >
                                                        {deleteLoadingUrl === item.url ? (
                                                            "Deleting..."
                                                        ) : (
                                                            <>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <Dialog
                open={Boolean(selectedRepo)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedRepo(null);
                        setUserRepoUrl("");
                        setCompareResult(null);
                        setCompareError("");
                    }
                }}
            >
                <DialogContent className="max-h-[92vh] w-[96vw] max-w-[1600px] overflow-y-auto overflow-x-hidden border-cyan-200 bg-[#f7fbff] p-5 sm:max-w-[1600px] md:p-6">          <DialogHeader>
                    <DialogTitle className="max-w-full break-words text-2xl leading-tight">
                        Compare with{" "}
                        <span className="break-all text-cyan-700">
                            {selectedRepo?.full_name}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                    <div className="space-y-6">
                        <Card className="border border-cyan-200/80 bg-white/80 shadow-sm">
                            <CardContent className="space-y-4 p-5">
                                <p className="text-sm leading-6 text-slate-600">
                                    Enter your repository URL. RepoLens will compare your repo
                                    with the selected leaderboard repo.
                                </p>

                                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                                    <div className="relative">
                                        <GitBranch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-700/70" />

                                        <Input
                                            className="h-12 border-cyan-200/90 bg-white pl-11 text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-300"
                                            placeholder="https://github.com/username/repository"
                                            value={userRepoUrl}
                                            onChange={(event) => setUserRepoUrl(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") handleCompare();
                                            }}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleCompare}
                                        disabled={compareLoading}
                                        className="h-12 bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-500 px-7 text-white shadow-lg shadow-cyan-500/25"
                                    >
                                        {compareLoading ? "Comparing..." : "Compare"}
                                        {!compareLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                    </Button>
                                </div>

                                {compareError && (
                                    <Alert className="border-red-200 bg-red-50 text-red-700 shadow-sm">
                                        <AlertDescription>{compareError}</AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                        {compareResult && (
                            <RepoComparisonResult
                                result={compareResult}
                                leftTitle="Leaderboard Repo"
                                rightTitle="Your Repo"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogContent className="max-w-md border-cyan-200 bg-[#f7fbff]">
                    <DialogHeader>
                        <DialogTitle>Admin Access</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <p className="text-sm leading-6 text-slate-600">
                            Enter admin password to unlock leaderboard delete controls.
                        </p>

                        <Input
                            type="password"
                            placeholder="Enter password"
                            value={passwordInput}
                            onChange={(event) => setPasswordInput(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") handleUnlockAdmin();
                            }}
                            className="h-12 border-cyan-200 bg-white"
                        />

                        {passwordError && (
                            <Alert className="border-red-200 bg-red-50 text-red-700">
                                <AlertDescription>{passwordError}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            onClick={handleUnlockAdmin}
                            className="h-12 w-full bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-500 text-white"
                        >
                            Unlock Admin Mode
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}