#!/usr/bin/env bash

set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="${BASE_DIR}/run"

for name in server1 server2 server3; do
  pid_file="${RUN_DIR}/${name}.pid"

  if [[ -f "${pid_file}" ]]; then
    pid="$(cat "${pid_file}")"
    if kill -0 "${pid}" >/dev/null 2>&1; then
      kill "${pid}"
      echo "Backend ${name} detenido."
    fi
    rm -f "${pid_file}"
  fi
done
