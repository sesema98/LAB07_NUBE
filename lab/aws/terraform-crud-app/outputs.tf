output "alb_dns_name" {
  description = "DNS publico del ALB que expone la app login+CRUD."
  value       = aws_lb.this.dns_name
}

output "app_instance_public_ips" {
  description = "IPs publicas de las dos EC2 de la app."
  value       = aws_instance.app[*].public_ip
}

output "app_instance_ids" {
  description = "IDs de las dos EC2 de la app."
  value       = aws_instance.app[*].id
}

output "target_group_arn" {
  description = "Target group del ALB."
  value       = aws_lb_target_group.app.arn
}
