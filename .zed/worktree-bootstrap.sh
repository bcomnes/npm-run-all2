#!/bin/sh
set -eu

log() {
  printf '[worktree-bootstrap] %s\n' "$*"
}

WORKTREE_ROOT=${ZED_WORKTREE_ROOT:-${CODEX_WORKTREE_PATH:-${1:-}}}

if [ -z "$WORKTREE_ROOT" ]; then
  log 'Worktree path is not set'
  exit 1
fi

if [ ! -d "$WORKTREE_ROOT" ]; then
  log "Worktree root does not exist: $WORKTREE_ROOT"
  exit 1
fi

if [ -d "$WORKTREE_ROOT/node_modules" ]; then
  log 'node_modules already exists; skipping dependency install'
  exit 0
fi

if ! command -v npm >/dev/null 2>&1; then
  log 'npm is not available; skipping dependency install'
  exit 0
fi

cd "$WORKTREE_ROOT"
log 'Installing dependencies with npm install --ignore-scripts'
npm install --ignore-scripts
log 'Dependency install complete'
