export const UPDATE_CONFIG = {
  githubRepo: import.meta.env.VITE_GITHUB_REPO ?? "YOUR_USERNAME/mgo",
  defaultBranch: "main",
} as const;

export const APP_VERSION =
  import.meta.env.VITE_APP_VERSION ?? "0.0.0";
