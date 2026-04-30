variable "aws_region" {
  description = "Region AWS para el laboratorio."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefijo de nombres para recursos."
  type        = string
  default     = "lab-lb"
}

variable "vpc_cidr" {
  description = "CIDR principal de la VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  description = "Tipo de instancia EC2."
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Nombre del key pair EC2 existente."
  type        = string
  default     = null
}

variable "allowed_ssh_cidr" {
  description = "CIDR permitido para SSH."
  type        = string
  default     = "0.0.0.0/0"
}

variable "enable_api_path_routing" {
  description = "Crea un backend API y una regla /api/* en el ALB."
  type        = bool
  default     = true
}

variable "enable_autoscaling" {
  description = "Usa Launch Template + Auto Scaling Group en lugar de dos EC2 fijas para el pool web."
  type        = bool
  default     = false
}
