#!/usr/bin/env bash
set -euo pipefail

echo "== Maestral Android Environment Check (Ubuntu) =="
echo

check_cmd() {
  local cmd="$1"
  local label="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "[OK] $label ($cmd found)"
  else
    echo "[MISSING] $label ($cmd not found)"
  fi
}

check_cmd java "Java runtime"
check_cmd adb "Android Debug Bridge"

echo
if command -v adb >/dev/null 2>&1; then
  echo "== adb devices =="
  adb devices || true
else
  echo "Skipping adb devices: adb not installed."
fi

echo
echo "Done."
