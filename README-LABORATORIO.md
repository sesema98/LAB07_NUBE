# README del Laboratorio

Este documento separa claramente la **Parte A** y la **Parte B** del laboratorio para que la revision sea directa.

El repositorio contiene una aplicacion web en **Node.js + Express + SQLite** con:

- Login con usuario y contrasena
- Sesiones
- CRUD completo de productos
- Endpoint `/health`
- Identificacion del backend que respondio
- Configuracion de balanceo local con **Nginx**
- Despliegue en AWS con **Application Load Balancer**

Credenciales de prueba:

- Usuario: `admin`
- Contrasena: `admin123`

---

## Parte A - Entorno local

### Objetivo

Demostrar que la aplicacion completa de **login + CRUD** corre en **tres instancias locales** y que **Nginx** distribuye el trafico entre ellas.

### Arquitectura usada

```text
Cliente -> Nginx local :8091 -> Backend 1 :8081
                           -> Backend 2 :8082
                           -> Backend 3 :8083
```

> Nota: en mi equipo local use `8091` para Nginx porque estoy en macOS con Homebrew. El comportamiento del balanceador es el mismo.

### Como levantar la Parte A

#### 1. Levantar los tres backends

```bash
cd /Users/sergiosebastian/Documents/NUBES_AVANZADA/multi-instance-product-app
npm run start:all
```

#### 2. Activar el balanceador local

```bash
cp /Users/sergiosebastian/Documents/NUBES_AVANZADA/multi-instance-product-app/lab/local/nginx/crud-round-robin-8091.conf /opt/homebrew/etc/nginx/servers/crud-round-robin-8091.conf
brew services restart nginx
```

### Rutas de prueba

#### Backends directos

- `http://localhost:8081/login`
- `http://localhost:8082/login`
- `http://localhost:8083/login`

#### Balanceador local

- `http://localhost:8091/login`
- `http://localhost:8091/products`
- `http://localhost:8091/health`
- `http://localhost:8091/demo`

### Pruebas sugeridas en terminal

#### Verificar cada backend

```bash
curl http://localhost:8081/health
curl http://localhost:8082/health
curl http://localhost:8083/health
```

#### Verificar el Round Robin por Nginx

```bash
for i in {1..6}; do
  curl -s http://localhost:8091/health
  echo
done
```

#### Script de apoyo incluido

```bash
/Users/sergiosebastian/Documents/NUBES_AVANZADA/multi-instance-product-app/lab/local/scripts/probe-crud-health.sh 9
```

### Evidencia esperada en la Parte A

#### Capturas de terminal

1. `npm run start:all`
2. `curl` a `8081`, `8082` y `8083`
3. `curl` repetido a `http://localhost:8091/health`

#### Capturas de navegador

1. `http://localhost:8091/login`
2. `http://localhost:8091/products`
3. `http://localhost:8091/products/new`
4. edicion de un producto
5. eliminacion de un producto
6. `http://localhost:8091/demo`

### Que demuestra esta parte

- Que existen tres instancias del backend
- Que el login y el CRUD funcionan localmente
- Que Nginx reparte las solicitudes entre `8081`, `8082` y `8083`

---

## Parte B - Nube AWS

### Objetivo

Demostrar que la aplicacion de **login + CRUD** fue desplegada detras de un **Application Load Balancer** en AWS usando **dos instancias EC2**.

### Arquitectura usada

```text
Internet -> Application Load Balancer :80 -> EC2 App 1 :3000
                                       -> EC2 App 2 :3000
```

### Implementacion usada

La infraestructura de esta parte esta en:

- [lab/aws/terraform-crud-app](./lab/aws/terraform-crud-app)

Esa variante despliega:

- 1 VPC
- 2 subredes publicas
- 1 ALB publico
- 2 instancias EC2 con la app Express real
- 1 Target Group con health check a `/health`

### URL del ALB

- `http://alb-crud-lb-177067463.us-east-2.elb.amazonaws.com`

### Rutas de prueba

- `http://alb-crud-lb-177067463.us-east-2.elb.amazonaws.com/login`
- `http://alb-crud-lb-177067463.us-east-2.elb.amazonaws.com/products`
- `http://alb-crud-lb-177067463.us-east-2.elb.amazonaws.com/health`
- `http://alb-crud-lb-177067463.us-east-2.elb.amazonaws.com/demo`

### Pruebas sugeridas en terminal

#### Health check del ALB

```bash
curl http://alb-crud-lb-177067463.us-east-2.elb.amazonaws.com/health
```

#### Verificar alternancia entre instancias

```bash
for i in {1..10}; do
  curl -s http://alb-crud-lb-177067463.us-east-2.elb.amazonaws.com/health
  echo
done
```

#### Verificar el estado de los targets

```bash
cd /Users/sergiosebastian/Documents/NUBES_AVANZADA/multi-instance-product-app/lab/aws/terraform-crud-app

aws elbv2 describe-target-health \
  --region us-east-2 \
  --target-group-arn $(terraform output -raw target_group_arn) \
  --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State]' \
  --output table
```

### Evidencia esperada en la Parte B

#### Capturas de terminal

1. `terraform output`
2. `describe-target-health` mostrando las dos instancias `healthy`
3. `curl` a `/health`
4. `curl` repetido a `/health`

#### Capturas de navegador

1. `http://alb-crud-lb-177067463.us-east-2.elb.amazonaws.com/login`
2. login exitoso
3. `products`
4. creacion de producto
5. edicion de producto
6. eliminacion de producto
7. `http://alb-crud-lb-177067463.us-east-2.elb.amazonaws.com/demo`

### Que demuestra esta parte

- Que la aplicacion real funciona detras de un ALB
- Que los targets EC2 estan saludables
- Que el balanceador distribuye trafico hacia dos instancias en AWS
- Que el login y el CRUD tambien funcionan en la nube

---

## Archivos clave del codigo

### Aplicacion

- [src/app.js](./src/app.js)
  - configura Express
  - define `/health`
  - define `/demo`
  - agrega `backendPort` y `backendInstance`

### Login y CRUD web

- [src/routes/web.js](./src/routes/web.js)

### Vistas HTML

- [src/views/login.ejs](./src/views/login.ejs)
- [src/views/products/list.ejs](./src/views/products/list.ejs)
- [src/views/products/form.ejs](./src/views/products/form.ejs)
- [src/views/products/show.ejs](./src/views/products/show.ejs)
- [src/views/demo.ejs](./src/views/demo.ejs)

### Balanceo local

- [lab/local/nginx/crud-round-robin-8091.conf](./lab/local/nginx/crud-round-robin-8091.conf)

### Infraestructura AWS

- [lab/aws/terraform-crud-app/main.tf](./lab/aws/terraform-crud-app/main.tf)
- [lab/aws/terraform-crud-app/variables.tf](./lab/aws/terraform-crud-app/variables.tf)
- [lab/aws/terraform-crud-app/outputs.tf](./lab/aws/terraform-crud-app/outputs.tf)

---

## Observaciones finales

- En local, el balanceo se demostro con tres instancias del backend y Nginx.
- En AWS, el balanceo se demostro con un Application Load Balancer y dos EC2.
- La app publica el backend que respondio mediante `/health` y `/demo`, lo que permite verificar visualmente el balanceo.
- En la variante AWS con SQLite local por instancia, el objetivo fue demostrar el balanceo de la aplicacion; para una arquitectura productiva real se recomendaria usar una base compartida como RDS.
