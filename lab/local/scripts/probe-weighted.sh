#!/usr/bin/env bash

set -euo pipefail

REQUESTS="${1:-100}"

for ((i = 1; i <= REQUESTS; i++)); do
  curl -s http://localhost
done | grep -o 'Servidor BACKEND [0-9]' | sort | uniq -c
