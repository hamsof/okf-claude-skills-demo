#!/usr/bin/env bash
# Rebuilds the static skills site whenever a skill file under .claude/skills is edited.
# Wired as a PostToolUse hook in .claude/settings.json (mirrors the skill-backup hook pattern).
#
# Two modes:
#   - Hook mode (stdin = PostToolUse JSON): only rebuilds when the edited file is under SRC.
#   - Manual mode (--full / no stdin): always rebuilds.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
[ -n "$ROOT" ] || exit 0
SRC="$ROOT/.claude/skills"

if [ "${1:-}" != "--full" ] && [ ! -t 0 ]; then
  payload="$(cat)"
  fp="$(printf '%s' "$payload" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.file_path||"")}catch(e){}})' 2>/dev/null)"
  case "$fp" in
    "$SRC"/*) ;;
    *) exit 0 ;;
  esac
fi

node "$ROOT/tools/build-html.mjs"
