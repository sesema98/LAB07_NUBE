# Guia del Laboratorio

Esta carpeta adapta el proyecto a la estructura del laboratorio y separa claramente:

- **Parte A:** balanceador local con Nginx y tres backends simples.
- **Parte B:** despliegue en AWS con ALB, health checks, path routing y Auto Scaling usando Terraform.

## Parte A

Los backends HTML simples estan en:

- `lab/local/server1`
- `lab/local/server2`
- `lab/local/server3`

Para levantarlos:

```bash
cd lab/local
chmod +x start-backends.sh stop-backends.sh scripts/*.sh
./start-backends.sh
```

Pruebas basicas:

```bash
curl http://localhost:8081
curl http://localhost:8082
curl http://localhost:8083
```

Configs de Nginx disponibles:

- `lab/local/nginx/round-robin.conf`
- `lab/local/nginx/least-conn.conf`
- `lab/local/nginx/ip-hash.conf`
- `lab/local/nginx/weighted-round-robin.conf`
- `lab/local/nginx/passive-health.conf`

Ejemplo de aplicacion:

```bash
sudo cp lab/local/nginx/round-robin.conf /etc/nginx/conf.d/balanceador.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Pruebas utiles:

```bash
./scripts/probe-round-robin.sh 9
./scripts/probe-weighted.sh 100
./scripts/ab-compare.sh 1000 50
```

### Alternativa usando la app Express actual

Si quieres demostrar el laboratorio con la app de este repo en vez de los backends Python, usa:

- `http://localhost:8081/demo`
- `http://localhost:8082/demo`
- `http://localhost:8083/demo`
- `http://localhost:8080/demo`

El endpoint `/demo` deja visible el puerto del backend que respondio.

### Parte A con Login + CRUD real

Si la evaluacion exige que la Parte A muestre la app completa con login y CRUD:

1. Levanta las tres instancias locales:

```bash
cd /Users/sergiosebastian/Documents/NUBES_AVANZADA/multi-instance-product-app
npm run start:all
```

2. Configura Nginx local apuntando a la app:

```bash
cp /Users/sergiosebastian/Documents/NUBES_AVANZADA/multi-instance-product-app/lab/local/nginx/crud-round-robin-8091.conf /opt/homebrew/etc/nginx/servers/crud-round-robin-8091.conf
brew services restart nginx
```

3. Rutas clave para la demo:

- Balanceador local de la app: `http://localhost:8091`
- Login: `http://localhost:8091/login`
- Demo visual de balanceo: `http://localhost:8091/demo`
- Health check balanceado: `http://localhost:8091/health`

4. Credenciales iniciales:

- Usuario: `admin`
- Contrasena: `admin123`

5. Prueba rapida del balanceo:

```bash
./lab/local/scripts/probe-crud-health.sh 9
```

## Parte B

La implementacion Terraform esta en `lab/aws/terraform`.

Incluye:

- VPC con dos subredes publicas.
- Security Group para HTTP/SSH.
- Dos instancias web o, opcionalmente, un Auto Scaling Group.
- ALB publico.
- Target Group con health check.
- Regla opcional `/api/*` hacia un backend API dedicado.

Uso base:

```bash
cd lab/aws/terraform
terraform init
terraform apply
```

Salidas esperadas:

- DNS del ALB
- IPs publicas de instancias web si se usa modo fijo
- IP publica de la instancia API si esta habilitada

Puedes activar o desactivar capacidades con variables:

- `enable_api_path_routing=true|false`
- `enable_autoscaling=true|false`

Ejemplos:

```bash
terraform apply -var enable_api_path_routing=true -var enable_autoscaling=false
terraform apply -var enable_api_path_routing=true -var enable_autoscaling=true
```

### Variante con la app Login + CRUD real

Si la entrega exige que el ALB publique tu aplicacion Express con login y CRUD, usa:

```bash
cd lab/aws/terraform-crud-app
terraform init
terraform apply \
  -var aws_region=us-east-2 \
  -var key_name=key-dockerb \
  -var allowed_ssh_cidr=$(curl -s ifconfig.me)/32
```

Documentacion adicional:

- `lab/aws/terraform-crud-app/README.md`
