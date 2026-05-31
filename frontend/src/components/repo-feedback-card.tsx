"use client";

import { useState } from "react";
import { Brain } from "lucide-react";

import { submitRepoFeedback } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type QualityLabel = "strong" | "average" | "weak";
type ScoreFeedback = "accurate" | "too_high" | "too_low";

type RepoFeedbackCardProps = {
  analysis: {
    repository: {
      full_name?: string | null;
      url?: string | null;
    };
    features: object;
    scores: object;
  };
};

export function RepoFeedbackCard({ analysis }: RepoFeedbackCardProps) {
  const [qualityLabel, setQualityLabel] = useState<QualityLabel | null>(null);
  const [scoreFeedback, setScoreFeedback] = useState<ScoreFeedback | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmitFeedback() {
    setError("");
    setMessage("");

    if (!qualityLabel || !scoreFeedback) {
      setError("Select repo quality and score feedback first.");
      return;
    }

    try {
      setLoading(true);

      await submitRepoFeedback({
        repository: analysis.repository,
        features: analysis.features,
        scores: analysis.scores,
        quality_label: qualityLabel,
        score_feedback: scoreFeedback,
      });

      setMessage("Feedback saved. RepoLens model learned from this label.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feedback submit failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-4xl overflow-hidden border border-emerald-200/80 bg-white/70 shadow-[0_24px_80px_rgba(16,185,129,0.14)] backdrop-blur-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-emerald-600" />
          Help RepoLens Learn
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-slate-600">
          Your feedback becomes training data for RepoLens&apos; custom ML model.
          This makes future scoring more meaningful.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-700">
              How strong is this repo?
            </p>

            <div className="grid gap-2">
              <Button
                variant={qualityLabel === "strong" ? "default" : "outline"}
                onClick={() => setQualityLabel("strong")}
                className={
                  qualityLabel === "strong"
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : ""
                }
              >
                Strong Repo
              </Button>

              <Button
                variant={qualityLabel === "average" ? "default" : "outline"}
                onClick={() => setQualityLabel("average")}
                className={
                  qualityLabel === "average"
                    ? "bg-cyan-500 text-white hover:bg-cyan-600"
                    : ""
                }
              >
                Average Repo
              </Button>

              <Button
                variant={qualityLabel === "weak" ? "default" : "outline"}
                onClick={() => setQualityLabel("weak")}
                className={
                  qualityLabel === "weak"
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : ""
                }
              >
                Weak Repo
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-700">
              How does the score feel?
            </p>

            <div className="grid gap-2">
              <Button
                variant={scoreFeedback === "accurate" ? "default" : "outline"}
                onClick={() => setScoreFeedback("accurate")}
                className={
                  scoreFeedback === "accurate"
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : ""
                }
              >
                Accurate
              </Button>

              <Button
                variant={scoreFeedback === "too_high" ? "default" : "outline"}
                onClick={() => setScoreFeedback("too_high")}
                className={
                  scoreFeedback === "too_high"
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : ""
                }
              >
                Score Too High
              </Button>

              <Button
                variant={scoreFeedback === "too_low" ? "default" : "outline"}
                onClick={() => setScoreFeedback("too_low")}
                className={
                  scoreFeedback === "too_low"
                    ? "bg-sky-500 text-white hover:bg-sky-600"
                    : ""
                }
              >
                Score Too Low
              </Button>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmitFeedback}
          disabled={loading}
          className="h-12 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-600 text-white shadow-lg shadow-emerald-500/25"
        >
          {loading ? "Saving Feedback..." : "Submit Feedback & Train Model"}
        </Button>

        {message && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50 text-red-700">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}