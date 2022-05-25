terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.region
}

module "ec2" {
  source         = "./child_modules/jam-ec2"
  region         = var.region
  environment    = var.environment
  ami            = var.jam-ami
  db-name        = var.db-name
  db-user        = var.db-user
  db-host        = var.db-host
  db-password    = var.db-password
  secret-key     = var.secret-key
  instance-type  = var.jam-instance-type
  hosted-zone-id = var.hosted-zone-id
}
