# Terraform para la Parte B

## Requisitos

- Terraform 1.5 o superior.
- AWS CLI configurado o credenciales AWS exportadas.

## Flujo recomendado

### Base del laboratorio

```bash
terraform init
terraform apply \
  -var aws_region=us-east-1 \
  -var key_name=TU_KEY_PAIR \
  -var allowed_ssh_cidr=TU_IP/32 \
  -var enable_api_path_routing=true \
  -var enable_autoscaling=false
```

Esto crea:

- VPC y dos subredes publicas.
- Security Group para HTTP/SSH.
- Dos EC2 web.
- ALB internet-facing.
- Target Group web.
- Backend API dedicado y regla `/api/*`.

### Ejercicio 5

Cuando quieras probar Auto Scaling:

```bash
terraform apply \
  -var aws_region=us-east-1 \
  -var key_name=TU_KEY_PAIR \
  -var allowed_ssh_cidr=TU_IP/32 \
  -var enable_api_path_routing=true \
  -var enable_autoscaling=true
```

En este modo, el pool web deja de usar las dos EC2 fijas y pasa a usar un ASG con capacidad deseada 2 y maxima 4.

## Limpieza

```bash
terraform destroy
```
