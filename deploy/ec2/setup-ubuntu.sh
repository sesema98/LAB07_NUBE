#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/multi-instance-product-app}"
APP_USER="${APP_USER:-ubuntu}"
APP_PORT="${APP_PORT:-8081}"
APP_HOST="${APP_HOST:-127.0.0.1}"
SITE_NAME="${SITE_NAME:-inventory-app}"
SESSION_SECRET="${SESSION_SECRET:-}"

if [[ -z "${SESSION_SECRET}" ]]; then
  echo "Falta SESSION_SECRET. Ejecuta:"
  echo "SESSION_SECRET=\"tu-secreto\" bash deploy/ec2/setup-ubuntu.sh"
  exit 1
fi

if [[ ! -d "${APP_DIR}" ]]; then
  echo "No existe APP_DIR: ${APP_DIR}"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/7] Instalando paquetes base..."
sudo apt update
sudo apt install -y curl git nginx build-essential ca-certificates

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "[2/7] Instalando Node.js 20 y npm..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
else
  echo "[2/7] Node.js ya esta instalado: $(node -v)"
  echo "[2/7] npm ya esta instalado: $(npm -v)"
fi

hash -r

echo "[3/7] Instalando dependencias npm..."
cd "${APP_DIR}"
npm ci

echo "[4/7] Creando servicio systemd..."
sudo tee /etc/systemd/system/${SITE_NAME}.service > /dev/null <<EOF
[Unit]
Description=Inventario Multi-Instancia
After=network.target

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
Environment=PORT=${APP_PORT}
Environment=HOST=${APP_HOST}
Environment=SESSION_SECRET=${SESSION_SECRET}
ExecStart=/usr/bin/node src/app.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "[5/7] Configurando Nginx..."
sudo tee /etc/nginx/sites-available/${SITE_NAME} > /dev/null <<EOF
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://${APP_HOST}:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/${SITE_NAME} /etc/nginx/sites-enabled/${SITE_NAME}
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

echo "[6/7] Reiniciando servicio y Nginx..."
sudo systemctl daemon-reload
sudo systemctl enable --now ${SITE_NAME}
sudo systemctl restart nginx

echo "[7/7] Estado final..."
sudo systemctl status ${SITE_NAME} --no-pager || true

health_ok=0
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS http://${APP_HOST}:${APP_PORT}/health >/dev/null 2>&1; then
    health_ok=1
    break
  fi
  sleep 1
done

if [[ "${health_ok}" -eq 1 ]]; then
  curl -fsS http://${APP_HOST}:${APP_PORT}/health || true
else
  echo "La app no respondio a tiempo en http://${APP_HOST}:${APP_PORT}/health"
  sudo journalctl -u ${SITE_NAME} -n 50 --no-pager || true
fi

echo
echo "Despliegue completado."
echo "Prueba en navegador: http://TU_IP_PUBLICA"
