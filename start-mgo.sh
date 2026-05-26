#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MGO_DIR="."
PORT="1420"
OPEN_BROWSER="1"

load_config() {
  local dat="${ROOT_DIR}/start-mgo.dat"
  [[ -f "$dat" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" ]] && continue

    local key="${line%%=*}"
    local val="${line#*=}"
    key="${key%"${key##*[![:space:]]}"}"
    key="${key#"${key%%[![:space:]]*}"}"
    val="${val#"${val%%[![:space:]]*}"}"
    val="${val%"${val##*[![:space:]]}"}"

    case "$key" in
      MGO_DIR) MGO_DIR="$val" ;;
      PORT) PORT="$val" ;;
      OPEN_BROWSER) OPEN_BROWSER="$val" ;;
    esac
  done < "$dat"
}

load_config

if ! PROJECT_DIR="$(cd "${ROOT_DIR}/${MGO_DIR}" && pwd)"; then
  echo "[MGo] Could not find project directory: ${MGO_DIR}" >&2
  exit 1
fi

cd "$PROJECT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "[MGo] Node.js is not installed or not in PATH." >&2
  echo "Install Node.js 20+ from https://nodejs.org/" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[MGo] npm is not installed or not in PATH." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "[MGo] Installing dependencies..."
  npm install
fi

echo ""
echo "================================================================"
echo "  DO NOT CLOSE THIS TERMINAL WHILE USING MGo"
echo "================================================================"
echo ""

echo "[MGo] Starting dev server..."
npm run mgo &
VITE_PID=$!
echo "$VITE_PID" > /tmp/mgo-vite.pid

URL="http://localhost:${PORT}"
ready=0

for _ in $(seq 1 60); do
  if curl -sf -o /dev/null "$URL" 2>/dev/null; then
    ready=1
    break
  fi
  if ! kill -0 "$VITE_PID" 2>/dev/null; then
    echo "[MGo] Dev server exited unexpectedly." >&2
    exit 1
  fi
  sleep 1
done

if [[ "$ready" -ne 1 ]]; then
  echo "[MGo] Server did not respond within 60 seconds at ${URL}" >&2
  exit 1
fi

if [[ "$OPEN_BROWSER" == "1" ]]; then
  if [[ "$(uname -s)" == "Darwin" ]]; then
    open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 || true
  else
    echo "[MGo] Could not open a browser automatically. Open ${URL} manually."
  fi
  echo "[MGo] Opened ${URL} in your browser."
else
  echo "[MGo] Server ready at ${URL}"
fi

echo "[MGo] Vite PID: ${VITE_PID} (saved to /tmp/mgo-vite.pid)"
echo "[MGo] Stop the server with: kill \$(cat /tmp/mgo-vite.pid)"
