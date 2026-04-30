# Inventario Multi-Instancia

> Para la presentacion del laboratorio, revisa primero [README-LABORATORIO.md](./README-LABORATORIO.md), donde la **Parte A** y la **Parte B** estan explicadas por separado.

Aplicacion web completa con Node.js, Express y SQLite que incluye:

- Login con usuario y contrasena.
- Sesiones persistidas en SQLite para soportar multiples instancias.
- CRUD completo de productos desde navegador y desde API JSON.
- Endpoint `/health` con estado `OK`.
- Puerto del backend visible en HTML, JSON y encabezado `X-Backend-Port`.
- Configuracion de Nginx en modo Round Robin para balancear entre `8081`, `8082` y `8083`.

## Requisitos

- Node.js 18 o superior.
- npm.
- Nginx instalado si quieres probar el balanceador local.

## Estructura

```text
multi-instance-product-app/
├── data/
├── nginx/
│   └── nginx.conf
├── src/
│   ├── middleware/
│   ├── public/css/
│   ├── routes/
│   ├── views/
│   ├── app.js
│   └── db.js
├── .gitignore
├── package.json
└── README.md
```

## Instalacion

```bash
cd multi-instance-product-app
npm install
```

## Credenciales iniciales

- Usuario: `admin`
- Contrasena: `admin123`

El usuario se crea automaticamente la primera vez que arranca la aplicacion.

## Ejecutar 3 servidores backend

Puedes levantar cada instancia por separado:

```bash
npm run start:8081
```

```bash
npm run start:8082
```

```bash
npm run start:8083
```

O lanzar las tres en paralelo:

```bash
npm run start:all
```

## Probar con navegador

Sin balanceador:

- `http://localhost:8081`
- `http://localhost:8082`
- `http://localhost:8083`

Con balanceador Nginx:

- `http://localhost:8080`

La interfaz siempre muestra el puerto del backend que respondio.

## Probar con curl

### Health check directo

```bash
curl -i http://localhost:8081/health
```

### Login por API guardando cookie de sesion

```bash
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  http://localhost:8080/api/login
```

### Verificar sesion

```bash
curl -i -b cookies.txt http://localhost:8080/api/session
```

### Crear producto

```bash
curl -i -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name":"Teclado","description":"Mecanico","price":89.90,"stock":12}' \
  http://localhost:8080/api/products
```

### Listar productos

```bash
curl -i -b cookies.txt http://localhost:8080/api/products
```

### Ver un producto

```bash
curl -i -b cookies.txt http://localhost:8080/api/products/1
```

### Actualizar un producto

```bash
curl -i -b cookies.txt \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{"name":"Teclado Pro","description":"Mecanico RGB","price":99.90,"stock":10}' \
  http://localhost:8080/api/products/1
```

### Eliminar un producto

```bash
curl -i -b cookies.txt \
  -X DELETE \
  http://localhost:8080/api/products/1
```

## Usar Nginx como balanceador Round Robin

El archivo de configuracion ya esta incluido en [nginx/nginx.conf](./nginx/nginx.conf).

1. Arranca los tres backends.
2. En otra terminal, lanza Nginx con ese archivo:

```bash
nginx -c /Users/sergiosebastian/Documents/NUBES_AVANZADA/multi-instance-product-app/nginx/nginx.conf
```

3. Abre `http://localhost:8080`.

Si quieres detener Nginx lanzado con esa configuracion:

```bash
nginx -s stop
```

## Variables utiles

- `PORT`: cambia el puerto de la instancia actual.
- `HOST`: por defecto `0.0.0.0`.
- `SESSION_SECRET`: secreto de sesion. Cambialo fuera de entornos de prueba.

## Despliegue rapido en EC2 Ubuntu

Este proyecto ya incluye un asistente de despliegue en [deploy/ec2/setup-ubuntu.sh](/Users/sergiosebastian/Documents/NUBES_AVANZADA/multi-instance-product-app/deploy/ec2/setup-ubuntu.sh).

### 1. Copiar el proyecto a la EC2

Si el proyecto esta en tu Mac:

```bash
scp -i ~/Downloads/key-dockerb.pem -r /Users/sergiosebastian/Documents/NUBES_AVANZADA/multi-instance-product-app ubuntu@3.14.254.120:/home/ubuntu/
```

### 2. Entrar a la instancia

```bash
ssh -i ~/Downloads/key-dockerb.pem ubuntu@3.14.254.120
```

O usa EC2 Instance Connect desde la consola de AWS.

### 3. Ejecutar el despliegue

```bash
cd /home/ubuntu/multi-instance-product-app
chmod +x deploy/ec2/setup-ubuntu.sh
SESSION_SECRET="$(openssl rand -hex 32)" bash deploy/ec2/setup-ubuntu.sh
```

### 4. Verificar

```bash
curl http://127.0.0.1:8081/health
curl http://3.14.254.120/health
```

### 5. Acceder desde navegador

```text
http://3.14.254.120
```

### 6. Reglas necesarias del Security Group

- `22` TCP desde tu IP para SSH o EC2 Instance Connect.
- `80` TCP desde `0.0.0.0/0`.
- `443` TCP desde `0.0.0.0/0` si luego activas HTTPS.

### 7. Credenciales iniciales

- Usuario: `admin`
- Contrasena: `admin123`

## Notas de balanceo

- Las tres instancias comparten la misma base SQLite ubicada en `data/app.db`.
- Las sesiones tambien se guardan en SQLite, por eso el login sigue activo aunque Nginx envie la siguiente peticion a otro backend.
- Todas las respuestas incluyen el encabezado `X-Backend-Port` para identificar la instancia que atendio la peticion.

## Ruta de demostracion

Si necesitas una pagina publica y simple para evidenciar el balanceo sin pasar por login, usa:

- `http://localhost:8081/demo`
- `http://localhost:8082/demo`
- `http://localhost:8083/demo`
- `http://localhost:8080/demo`

La pagina `/demo` muestra claramente el `backendPort` que atendio la respuesta.

## Material del laboratorio

Se agrego una carpeta [lab/README.md](/Users/sergiosebastian/Documents/NUBES_AVANZADA/multi-instance-product-app/lab/README.md) con:

- Parte A local con tres backends HTML simples y configuraciones de Nginx para `round robin`, `least_conn`, `ip_hash`, pesos y health checks pasivos.
- Scripts de prueba para curl y Apache Benchmark.
- Parte B en AWS con Terraform, user-data para EC2 web/API, ALB, Target Groups, path routing y Auto Scaling opcional.
- Variante para publicar la app real de login + CRUD detras de un ALB en dos EC2: [lab/aws/terraform-crud-app/README.md](/Users/sergiosebastian/Documents/NUBES_AVANZADA/multi-instance-product-app/lab/aws/terraform-crud-app/README.md).
