export type DeployTarget = "vercel" | "github-pages";

export function getDeployTarget(): DeployTarget {
  const raw = (process.env.NEXT_PUBLIC_DEPLOY_TARGET || "vercel").toLowerCase();
  return raw === "github-pages" ? "github-pages" : "vercel";
}

export function isGitHubPages(): boolean {
  return getDeployTarget() === "github-pages";
}

export function isVercelRuntime(): boolean {
  return getDeployTarget() === "vercel";
}
