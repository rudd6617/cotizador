#!/bin/bash
# SessionStart hook: inject project memory (Learning + Memory) into Claude's context.
# Strips HTML comment blocks (template instructions) and skips a file that has no
# real content (only headings / （尚無…） placeholders).
# Also nudges a convergence pass when Learning.md grows past the threshold.
CLAUDE_DIR="$CLAUDE_PROJECT_DIR/.claude"
LEARNING="$CLAUDE_DIR/Learning.md"
MEMORY="$CLAUDE_DIR/Memory.md"

# Convergence threshold: entries (## headings) or total lines.
MAX_ENTRIES=40
MAX_LINES=400

strip_comments() {
  # Single-line comments first: a same-line <!-- --> would open a sed range
  # that never closes and swallow the rest of the file.
  sed -e '/<!--.*-->/d' -e '/<!--/,/-->/d' "$1"
}

# Meaningful = any line that is not blank, not a heading, not a （尚無…） placeholder.
has_content() {
  grep -qvE '^[[:space:]]*$|^#|^（尚無.*）$' <<<"$1"
}

CONTENT=""

if [ -f "$LEARNING" ]; then
  stripped=$(strip_comments "$LEARNING")
  if has_content "$stripped"; then
    CONTENT="$CONTENT=== Learning (past mistakes & lessons) ===
$stripped
"
    entries=$(grep -c '^## ' "$LEARNING")
    lines=$(wc -l < "$LEARNING")
    if [ "$entries" -ge "$MAX_ENTRIES" ] || [ "$lines" -ge "$MAX_LINES" ]; then
      CONTENT="$CONTENT
[learning] Learning.md 已 ${entries} 條 / ${lines} 行，超過收斂門檻（${MAX_ENTRIES} 條 / ${MAX_LINES} 行）。建議收斂：合併重複、把反覆出現的教訓升級成 AGENTS.md 原則、刪過期條目（判準見 docs/MAINTENANCE.md §4）。
"
    fi
  fi
fi

if [ -f "$MEMORY" ]; then
  stripped=$(strip_comments "$MEMORY")
  if has_content "$stripped"; then
    CONTENT="$CONTENT
=== Memory (where to pick up) ===
$stripped
"
  fi
fi

[ -z "$CONTENT" ] && exit 0

printf '%s' "$CONTENT" | python3 -c 'import sys,json; print(json.dumps({"systemMessage": sys.stdin.read()}))'
