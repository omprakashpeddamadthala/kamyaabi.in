#!/usr/bin/env bash
# Rebuild the full-catalog reel from the LIVE store prices.
#   ./build.sh            fetch catalog + render everything
#   ./build.sh --offline  reuse data/ from the last fetch
set -euo pipefail
cd "$(dirname "$0")"
OUT=..
WORK=${WORK_DIR:-$(mktemp -d)}
mkdir -p "$WORK"
export NODE_PATH=${NODE_PATH:-$(npm root -g)}

[[ "${1:-}" == "--offline" ]] || python3 fetch_catalog.py

TL=$(node render.js timeline)
echo "timeline: $TL"
python3 music.py "$WORK/music.wav" "$TL"
rm -rf "$WORK/frames" && node render.js frames "$WORK/frames" 30

ENC=(-c:v libx264 -profile:v high -level 4.1 -preset slow -crf 18 -pix_fmt yuv420p -r 30 -g 60 -movflags +faststart)
ffmpeg -v error -y -framerate 30 -i "$WORK/frames/f%04d.jpg" -i "$WORK/music.wav" -map 0:v -map 1:a "${ENC[@]}" \
  -af "loudnorm=I=-14:TP=-2:LRA=7,alimiter=limit=0.79:level=disabled" -c:a aac -b:a 192k -ar 44100 -shortest "$OUT/kamyaabi-catalog-reel.mp4"
ffmpeg -v error -y -framerate 30 -i "$WORK/frames/f%04d.jpg" "${ENC[@]}" "$OUT/kamyaabi-catalog-reel-no-audio.mp4"

# Cover = the opening "starting at just ₹X" frame, fully animated in
cp "$WORK/frames/f0075.jpg" "$OUT/kamyaabi-catalog-reel-cover.jpg"
# One finished 1080x1920 card per product for Stories / WhatsApp Status
rm -rf "$OUT/story-cards" && node render.js cards "$OUT/story-cards"
echo "done -> $(cd "$OUT" && pwd)"
