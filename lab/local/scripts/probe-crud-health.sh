#!/usr/bin/env bash

set -euo pipefail

REQUESTS="${1:-9}"

for ((i = 1; i <= REQUESTS; i++)); do
  curl -s http://localhost:8091/health
  echo
done
