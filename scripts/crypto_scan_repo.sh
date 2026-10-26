#!/usr/bin/env bash
# Inventory one repository with raybeecham/crypto-inventory-demo (checked out at ./tool).
# Usage: crypto_scan_repo.sh <repo>   (expects $CODEQL and $SEARCH_PATH)
# Writes scan/<repo>/inventory.json; any failure exits non-zero.
set -euo pipefail

repo="$1"
src="targets/$repo"
out="scan/$repo"
mkdir -p targets db "$out"

git clone --quiet --depth 1 "https://github.com/raybeecham/$repo" "$src"

inventories=()
# -print -quit instead of piping to grep -q, which trips pipefail on large trees.
if [ -n "$(find "$src" -name '*.py' -not -path '*/.git/*' -print -quit)" ]; then
  "$CODEQL" database create "db/$repo" --language=python --source-root "$src" --overwrite --quiet
  "$CODEQL" query run tool/queries-python/python-crypto-inventory.ql \
    --database "db/$repo" --search-path "$SEARCH_PATH" \
    --additional-packs tool/queries-python --output "$out/python.bqrs"
  "$CODEQL" bqrs decode --format=json --entities=string --output "$out/python.json" -- "$out/python.bqrs"
  python tool/scripts/cbom.py from-bqrs-json "$out/python.json" \
    --output "$out/inventory-python.json" --summary "$out/summary-python.txt"
  inventories+=("$out/inventory-python.json")
fi

python tool/scripts/scan_tls_config.py "$src" --output "$out/inventory-config.json"
inventories+=("$out/inventory-config.json")
python tool/scripts/cbom.py combine "${inventories[@]}" --output "$out/inventory.json" --summary "$out/summary.txt"
