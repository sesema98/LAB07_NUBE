#!/usr/bin/env bash

set -euo pipefail

REQUESTS="${1:-1000}"
CONCURRENCY="${2:-50}"

if ! command -v ab >/dev/null 2>&1; then
  echo "Apache Benchmark no esta instalado. Usa: sudo apt install apache2-utils -y"
  exit 1
fi

echo "=== Prueba directa contra backend 8081 ==="
ab -n "${REQUESTS}" -c "${CONCURRENCY}" http://127.0.0.1:8081/

echo
echo "=== Prueba a traves de Nginx ==="
ab -n "${REQUESTS}" -c "${CONCURRENCY}" http://127.0.0.1/
