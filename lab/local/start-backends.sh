#!/usr/bin/env bash

set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="${BASE_DIR}/run"

mkdir -p "${RUN_DIR}"

start_backend() {
  local name="$1"
  local port="$2"

  if lsof -ti tcp:"${port}" >/dev/null 2>&1; then
    echo "El puerto ${port} ya esta en uso. Detenlo antes de continuar."
    exit 1
  fi

  (
    cd "${BASE_DIR}/${name}"
    python3 -m http.server "${port}" > "${RUN_DIR}/${name}.log" 2>&1 &
    echo $! > "${RUN_DIR}/${name}.pid"
  )

  echo "Backend ${name} levantado en http://127.0.0.1:${port}"
}

start_backend "server1" 8081
start_backend "server2" 8082
start_backend "server3" 8083
