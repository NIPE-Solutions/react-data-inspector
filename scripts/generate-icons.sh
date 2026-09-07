#!/bin/sh
# Requires librsvg (rsvg-convert) and ImageMagick (magick).
set -eu
cd "$(dirname "$0")/.."
for size in 16 32 48 180 192 512; do
  case "$size" in
    16|32) name="favicon-$size" ;;
    48) name="favicon-48" ;;
    180) name="apple-touch-icon" ;;
    *) name="icon-$size" ;;
  esac
  rsvg-convert -w "$size" -h "$size" website/public/logo.svg -o "website/public/$name.png"
done
magick website/public/favicon-16.png website/public/favicon-32.png website/public/favicon-48.png website/public/favicon.ico

rsvg-convert website/public/social.svg -o website/public/social.png
