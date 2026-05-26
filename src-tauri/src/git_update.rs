use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResult {
    pub behind_by: u32,
    pub remote_version: Option<String>,
    pub local_version: Option<String>,
    pub is_critical: bool,
    pub latest_sha: Option<String>,
    pub can_pull: bool,
    pub reason: Option<String>,
}

fn find_app_root() -> Option<PathBuf> {
    if let Ok(root) = std::env::var("MGO_ROOT") {
        let p = PathBuf::from(root);
        if p.join("package.json").is_file() {
            return Some(p);
        }
    }

    let mut dir = std::env::current_dir().ok()?;
    loop {
        if dir.join("package.json").is_file() && dir.join(".git").exists() {
            return Some(dir);
        }
        if !dir.pop() {
            break;
        }
    }
    None
}

fn run_git(root: &Path, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(root)
        .output()
        .map_err(|e| format!("git not available: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(format!("{stderr}{stdout}").trim().to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn parse_package_version(json: &str) -> Option<String> {
    let value: serde_json::Value = serde_json::from_str(json).ok()?;
    value
        .get("version")
        .and_then(|v| v.as_str())
        .map(str::to_string)
}

fn read_local_version(root: &Path) -> Option<String> {
    let content = std::fs::read_to_string(root.join("package.json")).ok()?;
    parse_package_version(&content)
}

fn semver_gt(a: &str, b: &str) -> bool {
    let parse = |s: &str| -> Vec<u32> {
        s.split('.')
            .take(3)
            .map(|p| p.parse().unwrap_or(0))
            .collect()
    };
    let pa = parse(a);
    let pb = parse(b);
    for i in 0..3 {
        let av = *pa.get(i).unwrap_or(&0);
        let bv = *pb.get(i).unwrap_or(&0);
        if av > bv {
            return true;
        }
        if av < bv {
            return false;
        }
    }
    false
}

fn no_git_result(local_version: Option<String>) -> UpdateCheckResult {
    UpdateCheckResult {
        behind_by: 0,
        remote_version: None,
        local_version,
        is_critical: false,
        latest_sha: None,
        can_pull: false,
        reason: Some("no_git".into()),
    }
}

#[tauri::command]
pub fn check_git_update(branch: Option<String>) -> UpdateCheckResult {
    let branch = branch.unwrap_or_else(|| "main".to_string());
    let local_fallback = read_local_version(Path::new("."));

    let Some(root) = find_app_root() else {
        return no_git_result(local_fallback);
    };

    if run_git(&root, &["rev-parse", "--git-dir"]).is_err() {
        return no_git_result(read_local_version(&root));
    }

    let _ = run_git(&root, &["fetch", "origin"]);

    let behind_by = run_git(
        &root,
        &[
            "rev-list",
            &format!("HEAD..origin/{branch}"),
            "--count",
        ],
    )
    .ok()
    .and_then(|s| s.parse().ok())
    .unwrap_or(0);

    let latest_sha =
        run_git(&root, &["rev-parse", &format!("origin/{branch}")]).ok();

    let local_version = read_local_version(&root);
    let remote_version = run_git(
        &root,
        &["show", &format!("origin/{branch}:package.json")],
    )
    .ok()
    .and_then(|s| parse_package_version(&s));

    let is_critical = match (&local_version, &remote_version) {
        (Some(local), Some(remote)) => semver_gt(remote, local) || behind_by > 0,
        _ => behind_by > 0,
    };

    UpdateCheckResult {
        behind_by,
        remote_version,
        local_version,
        is_critical,
        latest_sha,
        can_pull: true,
        reason: None,
    }
}

#[tauri::command]
pub fn pull_git_update(branch: Option<String>) -> Result<String, String> {
    let branch = branch.unwrap_or_else(|| "main".to_string());
    let root = find_app_root().ok_or_else(|| "no_git".to_string())?;
    run_git(&root, &["pull", "origin", &branch])
}
