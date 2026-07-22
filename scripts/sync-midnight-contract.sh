#!/usr/bin/env bash
# Syncs the compiled POAP Compact contract artifacts from the sibling poap-midnight repo
# into this repo. poap-midnight/contracts is the source of truth (compiled via compactc);
# this script copies its output so the frontend can import it and serve the ZK keys/zkir
# as static assets. Re-run whenever the contract is recompiled or redeployed.
set -euo pipefail

SRC_ROOT="${POAP_MIDNIGHT_DIR:-/Users/matifalcone/Projects/poap-midnight}"
DEST_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC_CONTRACT="$SRC_ROOT/contracts/src/managed/poap/contract"
SRC_KEYS="$SRC_ROOT/contracts/src/managed/poap/keys"
SRC_ZKIR="$SRC_ROOT/contracts/src/managed/poap/zkir"

DEST_CONTRACT="$DEST_ROOT/src/midnight/contract/managed/poap/contract"
DEST_PUBLIC="$DEST_ROOT/public/midnight/poap"

if [ ! -d "$SRC_CONTRACT" ]; then
  echo "error: compiled contract not found at $SRC_CONTRACT (run compactc in poap-midnight/contracts first)" >&2
  exit 1
fi

mkdir -p "$DEST_CONTRACT" "$DEST_PUBLIC"

cp "$SRC_CONTRACT/index.cjs" "$SRC_CONTRACT/index.cjs.map" "$SRC_CONTRACT/index.d.cts" "$DEST_CONTRACT/"
rm -rf "$DEST_PUBLIC/keys" "$DEST_PUBLIC/zkir"
cp -r "$SRC_KEYS" "$DEST_PUBLIC/keys"
cp -r "$SRC_ZKIR" "$DEST_PUBLIC/zkir"

echo "Synced contract artifacts:"
echo "  $DEST_CONTRACT/{index.cjs,index.cjs.map,index.d.cts}"
echo "  $DEST_PUBLIC/{keys,zkir}"
