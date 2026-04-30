output "alb_dns_name" {
  description = "DNS publico del Application Load Balancer."
  value       = aws_lb.this.dns_name
}

output "security_group_id" {
  description = "Security Group del laboratorio."
  value       = aws_security_group.web.id
}

output "vpc_id" {
  description = "VPC creada para el laboratorio."
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "Subredes publicas usadas por el laboratorio."
  value       = aws_subnet.public[*].id
}

output "web_instance_public_ips" {
  description = "IPs publicas de las instancias web cuando no se usa Auto Scaling."
  value       = aws_instance.web[*].public_ip
}

output "api_instance_public_ip" {
  description = "IP publica del backend API cuando esta habilitado."
  value       = try(aws_instance.api[0].public_ip, null)
}

output "autoscaling_group_name" {
  description = "Nombre del ASG cuando esta habilitado."
  value       = try(aws_autoscaling_group.web[0].name, null)
}
