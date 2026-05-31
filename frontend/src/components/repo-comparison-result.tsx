"use client";

import { Bungee } from "next/font/google";
import { ExternalLink, Info, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const displayFont = Bungee({
    subsets: ["latin"],
    weight: "400",
});

export type RepoCompareResult = {
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

type RepoComparisonResultProps = {
    result: RepoCompareResult;
    leftTitle?: string;
    rightTitle?: string;
};

function winnerText(
    winner: "repo_a" | "repo_b" | "tie",
    leftTitle: string,
    rightTitle: string
) {
    if (winner === "repo_a") return `${leftTitle} wins`;
    if (winner === "repo_b") return `${rightTitle} wins`;
    return "Tie";
}

function ScoreLine({
    label,
    left,
    right,
    winner,
    leftTitle,
    rightTitle,
}: {
    label: string;
    left: number;
    right: number;
    winner: "repo_a" | "repo_b" | "tie";
    leftTitle: string;
    rightTitle: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-sm">
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                    <p className="text-sm font-bold text-slate-950">{label}</p>
                    <p className="text-xs font-medium text-slate-500">
                        {winnerText(winner, leftTitle, rightTitle)}
                    </p>
                </div>

                <p className="text-sm font-bold text-slate-950">
                    {left} vs {right}
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span className="truncate pr-2">{leftTitle}</span>
                        <span>{left}/100</span>
                    </div>
                    <Progress value={left} className="h-2" />
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span className="truncate pr-2">{rightTitle}</span>
                        <span>{right}/100</span>
                    </div>
                    <Progress value={right} className="h-2" />
                </div>
            </div>
        </div>
    );
}

function MissingList({
    title,
    items,
    emptyText,
    color,
}: {
    title: string;
    items: string[];
    emptyText: string;
    color: "orange" | "cyan";
}) {
    const colorClass =
        color === "orange"
            ? "border-orange-200 bg-orange-50/75 text-orange-900"
            : "border-cyan-200 bg-cyan-50/75 text-cyan-900";

    const titleClass = color === "orange" ? "text-orange-800" : "text-cyan-800";

    return (
        <Card className={`border ${colorClass}`}>
            <CardHeader>
                <CardTitle className={titleClass}>{title}</CardTitle>
            </CardHeader>

            <CardContent>
                {items.length > 0 ? (
                    <ul className="list-disc space-y-2 break-words pl-5 text-sm leading-6">
                        {items.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm leading-6 opacity-80">{emptyText}</p>
                )}
            </CardContent>
        </Card>
    );
}

function ImprovementList({
    title,
    items,
    emptyText,
}: {
    title: string;
    items: string[];
    emptyText: string;
}) {
    return (
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/70 p-5">
            <h3 className="font-bold text-slate-950">{title}</h3>

            {items.length > 0 ? (
                <ul className="list-disc space-y-2 break-words pl-5 text-sm leading-6 text-slate-700">
                    {items.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm leading-6 text-slate-600">{emptyText}</p>
            )}
        </div>
    );
}

export function RepoComparisonResult({
    result,
    leftTitle = "Repo A",
    rightTitle = "Repo B",
}: RepoComparisonResultProps) {
    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/80 px-5 py-4 text-sm leading-6 text-cyan-900 shadow-sm">
                <div className="flex gap-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" />
                    <p>
                        Comparison scores and suggestions are based only on these two repositories.
                        RepoLens checks visible repository signals such as README, tests, Docker,
                        CI/CD, documentation, activity, and structure.
                    </p>
                </div>
            </div>
            <Card className="overflow-hidden border border-emerald-200/80 bg-white/80 shadow-[0_20px_70px_rgba(16,185,129,0.16)]">
                <CardContent className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)] md:items-center">
                    <div className="min-w-0 rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 text-center">
                        <p className="text-sm font-semibold text-cyan-700">{leftTitle}</p>

                        <p className="mt-1 break-all font-bold leading-6 text-slate-950">
                            {result.repo_a.repository.full_name}
                        </p>

                        <p
                            className={`${displayFont.className} mt-3 bg-gradient-to-r from-cyan-500 to-sky-600 bg-clip-text text-5xl leading-none text-transparent`}
                        >
                            {result.overall_winner.repo_a_score}
                        </p>

                        <Button asChild variant="outline" className="mt-4">
                            <a
                                href={result.repo_a.repository.url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Open Repo
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>

                    <div className="min-w-0 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-emerald-500 shadow-lg shadow-cyan-500/25">
                            <Trophy className="h-8 w-8 text-white" />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-500">
                            Overall Winner
                        </p>

                        <p className="break-all font-bold leading-6 text-slate-950">
                            {result.overall_winner.winner_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Difference: {result.overall_winner.difference}
                        </p>
                    </div>

                    <div className="min-w-0 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 text-center">
                        <p className="text-sm font-semibold text-emerald-700">
                            {rightTitle}
                        </p>

                        <p className="mt-1 break-all font-bold leading-6 text-slate-950">
                            {result.repo_b.repository.full_name}
                        </p>

                        <p
                            className={`${displayFont.className} mt-3 bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-5xl leading-none text-transparent`}
                        >
                            {result.overall_winner.repo_b_score}
                        </p>

                        <Button asChild variant="outline" className="mt-4">
                            <a
                                href={result.repo_b.repository.url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Open Repo
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white/80 shadow-sm">
                <CardHeader>
                    <CardTitle>Category Comparison</CardTitle>
                </CardHeader>

                <CardContent className="grid gap-4 xl:grid-cols-2">
                    {Object.entries(result.winners).map(([key, value]) => (
                        <ScoreLine
                            key={key}
                            label={value.label}
                            left={value.repo_a_score}
                            right={value.repo_b_score}
                            winner={value.winner}
                            leftTitle={leftTitle}
                            rightTitle={rightTitle}
                        />
                    ))}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <MissingList
                    title={`Missing in ${leftTitle}`}
                    items={result.missing_for_a}
                    emptyText={`${leftTitle} is not missing major detected features compared to ${rightTitle}.`}
                    color="orange"
                />

                <MissingList
                    title={`Missing in ${rightTitle}`}
                    items={result.missing_for_b}
                    emptyText={`${rightTitle} is not missing major detected features compared to ${leftTitle}.`}
                    color="cyan"
                />
            </div>

            <Card className="border border-emerald-200 bg-emerald-50/70">
                <CardHeader>
                    <CardTitle className="text-emerald-800">
                        RepoLens Comparison Review
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5">
                    <p className="break-words text-sm leading-6 text-emerald-900/80">
                        {result.review.summary}
                    </p>

                    <Separator />

                    <div className="grid gap-5 md:grid-cols-2">
                        <ImprovementList
                            title={`Improvement Plan for ${leftTitle}`}
                            items={result.review.improvement_for_a}
                            emptyText={`${leftTitle} already covers the major detected signals.`}
                        />

                        <ImprovementList
                            title={`Improvement Plan for ${rightTitle}`}
                            items={result.review.improvement_for_b}
                            emptyText={`${rightTitle} already covers the major detected signals.`}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}