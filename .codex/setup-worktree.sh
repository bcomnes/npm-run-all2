#!/bin/sh
set -eu

WORKTREE_ROOT=${CODEX_WORKTREE_PATH:-$(pwd)}
BOOTSTRAP_SCRIPT=$WORKTREE_ROOT/.zed/worktree-bootstrap.sh

if [ ! -f "$BOOTSTRAP_SCRIPT" ]; then
  printf '[codex-worktree-bootstrap] Bootstrap script not found: %s\n' "$BOOTSTRAP_SCRIPT" >&2
  exit 1
fi

exec sh "$BOOTSTRAP_SCRIPT" "$WORKTREE_ROOT"
