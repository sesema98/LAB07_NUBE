# ALB para la app Login + CRUD

Esta variante despliega **tu app Express real** en **dos EC2** detras de un **Application Load Balancer**.

## Importante

Esta version esta orientada a **demo de laboratorio**:

- Cada EC2 mantiene su propia base SQLite local.
- El ALB usa **stickiness** para que el usuario siga cayendo en la misma instancia.
- El login y el CRUD se pueden demostrar correctamente, pero los datos **no se comparten** entre ambas EC2.

Si quisieras consistencia real entre instancias, el siguiente paso seria mover datos a **RDS** y sesiones a **Redis**.

## Requisitos

- Terraform instalado.
- AWS CLI configurado.
- Repositorio GitHub publico de la app.

## Despliegue

```bash
cd lab/aws/terraform-crud-app
terraform init
terraform apply \
  -var aws_region=us-east-2 \
  -var key_name=key-dockerb \
  -var allowed_ssh_cidr=$(curl -s ifconfig.me)/32
```

## Pruebas

Ver salidas:

```bash
terraform output
```

Abrir la app:

```bash
open "http://$(terraform output -raw alb_dns_name)"
```

Health check del ALB:

```bash
curl "http://$(terraform output -raw alb_dns_name)/health"
```

Pagina demo sin login:

```bash
curl "http://$(terraform output -raw alb_dns_name)/demo"
```

Credenciales iniciales:

- Usuario: `admin`
- Contrasena: `admin123`

## Evidencia del balanceo

El endpoint `/health` devuelve:

- `backendPort`
- `backendInstance`

La interfaz HTML tambien muestra la instancia que atendio la respuesta.

## Limpieza

```bash
terraform destroy \
  -var aws_region=us-east-2 \
  -var key_name=key-dockerb \
  -var allowed_ssh_cidr=$(curl -s ifconfig.me)/32
```
