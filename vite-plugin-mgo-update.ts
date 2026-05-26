import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { Connect, Plugin } from "vite";

const execFileAsync = promisify(execFile);
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const defaultBranch = "main";

async function runGit(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: projectRoot,
    windowsHide: true,
  });
  return stdout.trim();
}

function parseVersion(json: string): string | null {
  try {
    const pkg = JSON.parse(json) as { version?: string };
    return pkg.version ?? null;
  } catch {
    return null;
  }
}

function semverGt(a: string, b: string): boolean {
  const parse = (s: string) =>
    s.split(".").slice(0, 3).map((p) => parseInt(p, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return true;
    if (pa[i] < pb[i]) return false;
  }
  return false;
}

async function gitCheck(): Promise<Record<string, unknown>> {
  try {
    await runGit(["rev-parse", "--git-dir"]);
  } catch {
    const localRaw = await readFile(
      path.join(projectRoot, "package.json"),
      "utf-8",
    );
    return {
      behindBy: 0,
      remoteVersion: null,
      localVersion: parseVersion(localRaw),
      isCritical: false,
      latestSha: null,
      canPull: false,
      reason: "no_git",
    };
  }

  try {
    await runGit(["fetch", "origin"]);
  } catch {
    /* offline — still try local compare */
  }

  const behindStr = await runGit([
    "rev-list",
    `HEAD..origin/${defaultBranch}`,
    "--count",
  ]).catch(() => "0");
  const behindBy = parseInt(behindStr, 10) || 0;

  const latestSha = await runGit([
    "rev-parse",
    `origin/${defaultBranch}`,
  ]).catch(() => null);

  const localRaw = await readFile(
    path.join(projectRoot, "package.json"),
    "utf-8",
  );
  const localVersion = parseVersion(localRaw);

  const remoteRaw = await runGit([
    "show",
    `origin/${defaultBranch}:package.json`,
  ]).catch(() => null);
  const remoteVersion = remoteRaw ? parseVersion(remoteRaw) : null;

  const isCritical =
    behindBy > 0 ||
    (remoteVersion && localVersion
      ? semverGt(remoteVersion, localVersion)
      : false);

  return {
    behindBy,
    remoteVersion,
    localVersion,
    isCritical,
    latestSha,
    canPull: true,
    reason: null,
  };
}

async function gitPull(): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const message = await runGit(["pull", "origin", defaultBranch]);
    return { ok: true, message };
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    return {
      ok: false,
      error: (err.stderr ?? err.message ?? String(e)).trim(),
    };
  }
}

export function mgoUpdatePlugin(): Plugin {
  return {
    name: "mgo-update-dev-api",
    configureServer(server) {
      server.middlewares.use(((
        req: Connect.IncomingMessage,
        res: Connect.ServerResponse,
        next: Connect.NextFunction,
      ) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/mgo/update")) {
          next();
          return;
        }

        void (async () => {
          try {
            if (url === "/api/mgo/update/check" && req.method === "GET") {
              const body = await gitCheck();
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(body));
              return;
            }

            if (url === "/api/mgo/update/pull" && req.method === "POST") {
              const body = await gitPull();
              res.statusCode = body.ok ? 200 : 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(body));
              return;
            }

            res.statusCode = 404;
            res.end();
          } catch (e) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: e instanceof Error ? e.message : String(e),
              }),
            );
          }
        })();
      }) as Connect.NextHandleFunction);
    },
  };
}
