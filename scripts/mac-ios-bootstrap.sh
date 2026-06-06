#!/usr/bin/env bash
set -euo pipefail

echo "Preparing Reminder Tracker for Xcode..."
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node 20+ from https://nodejs.org/ and rerun."
  exit 1
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "Xcode command line tools were not found."
  echo "Install Xcode from the Mac App Store, then run: xcode-select --install"
  exit 1
fi

npm install
npm run ios:sync

echo
echo "Done. Open the native project with: npm run ios:open"
echo "Then set your Apple Developer Team in Xcode under Signing & Capabilities."
