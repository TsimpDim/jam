variable "environment" {
  type = string
  default = "dev"
  nullable = false
  description = "Specifies the environments in which you want to deploy."
}

variable "region" {
  type = string
  default = "eu-west-1"
  nullable = false
  description = "Specifies the AWS Region in which you want to deploy."
}