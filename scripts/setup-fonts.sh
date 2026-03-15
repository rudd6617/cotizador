#!/bin/bash
set -e

FONT_DIR="public/fonts"
FONT_FILE="$FONT_DIR/NotoSansTC.ttf"

if [ -f "$FONT_FILE" ]; then
  echo "Font already exists, skipping download."
  exit 0
fi

mkdir -p "$FONT_DIR"
echo "Downloading Noto Sans TC..."
curl -L "https://github.com/google/fonts/raw/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf" -o "$FONT_FILE"
echo "Done."
