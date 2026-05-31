const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function checkBackendHealth() {
  const response = await fetch(`${API_URL}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Backend health check failed");
  }

  return response.json();
}

export async function analyzeRepo(repoUrl: string) {
  const response = await fetch(`${API_URL}/api/repo/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo_url: repoUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Repository analysis failed");
  }

  return data;
}

export async function analyzeProfile(username: string, maxRepos = 10) {
  const response = await fetch(`${API_URL}/api/profile/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      max_repos: maxRepos,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Profile analysis failed");
  }

  return data;
}

export async function getLeaderboard(limit = 10) {
  const response = await fetch(`${API_URL}/api/leaderboard?limit=${limit}`, {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Leaderboard fetch failed");
  }

  return data;
}

export async function compareRepos(repoAUrl: string, repoBUrl: string) {
  const response = await fetch(`${API_URL}/api/repo/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo_a_url: repoAUrl,
      repo_b_url: repoBUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Repository comparison failed");
  }

  return data;
}

export async function deleteLeaderboardItem(
  repoUrl: string,
  adminPassword: string
) {
  const response = await fetch(
    `${API_URL}/api/leaderboard?repo_url=${encodeURIComponent(repoUrl)}`,
    {
      method: "DELETE",
      headers: {
        "X-Admin-Password": adminPassword,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to delete leaderboard item");
  }

  return data;
}

export async function getPublicStats() {
  const response = await fetch(`${API_URL}/api/stats`, {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Stats fetch failed");
  }

  return data;
}

export async function submitRepoFeedback(payload: {
  repository: object;
  features: object;
  scores: object;
  quality_label: "strong" | "average" | "weak";
  score_feedback: "accurate" | "too_high" | "too_low";
  comment?: string;
}) {
  const response = await fetch(`${API_URL}/api/feedback/repo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Feedback submit failed");
  }

  return data;
}