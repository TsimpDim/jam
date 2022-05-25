variable "environment" {
  type        = string
  default     = "dev"
  nullable    = false
  description = "Specifies the environments in which you want to deploy."
}

variable "region" {
  type        = string
  default     = "eu-west-1"
  nullable    = false
  description = "Specifies the AWS Region in which you want to deploy."
}

variable "ami" {
  type        = string
  nullable    = false
  description = "Specifies which EC2 AMI to use for the deployment."
}

variable "db-name" {
  type        = string
  nullable    = false
  description = "Database name."
}

variable "db-user" {
  type        = string
  nullable    = false
  description = "Database user."
}

variable "db-password" {
  type        = string
  nullable    = false
  description = "Database password."
}

variable "db-host" {
  type        = string
  nullable    = false
  description = "Database host."
}

variable "secret-key" {
  type        = string
  nullable    = false
  description = "Django secret key."
}

variable "instance-type" {
  type        = string
  nullable    = false
  description = "JAM instance type."
  default     = "t2.micro"
}

variable "hosted-zone-id" {
  type        = string
  nullable    = false
  description = "Hosted zone ID"
}
