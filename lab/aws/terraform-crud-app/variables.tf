variable "aws_region" {
  description = "Region AWS para desplegar la app."
  type        = string
  default     = "us-east-2"
}

variable "project_name" {
  description = "Prefijo de nombres para recursos."
  type        = string
  default     = "crud-lb"
}

variable "vpc_cidr" {
  description = "CIDR de la VPC."
  type        = string
  default     = "10.10.0.0/16"
}

variable "instance_type" {
  description = "Tipo de instancia EC2."
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Nombre del key pair EC2."
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR permitido para SSH."
  type        = string
}

variable "app_repo_url" {
  description = "Repositorio Git publico con la app."
  type        = string
  default     = "https://github.com/sesema98/LAB07_NUBE.git"
}

variable "app_branch" {
  description = "Branch a desplegar."
  type        = string
  default     = "main"
}

variable "app_port" {
  description = "Puerto interno donde corre Express en las EC2."
  type        = number
  default     = 3000
}

variable "session_secret" {
  description = "Session secret comun entre las dos instancias. Si queda vacio, Terraform genera uno."
  type        = string
  default     = ""
}
