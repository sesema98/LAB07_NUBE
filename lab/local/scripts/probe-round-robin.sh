#!/usr/bin/env bash

set -euo pipefail

REQUESTS="${1:-9}"

for ((i = 1; i <= REQUESTS; i++)); do
  curl -s http://localhost | grep -o 'Servidor BACKEND [0-9] - Puerto [0-9]*'
done
