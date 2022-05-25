terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

resource "aws_security_group" "jam" {
  name        = "jam-sg"
  description = "Allow HTTP(S) inbound traffic"

  ingress {
    description      = "Public TLS"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "Public HTTP"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "Jam"
  }
}

resource "aws_instance" "jam" {
  ami           = var.ami
  instance_type = var.instance-type
  user_data = <<EOF
  #!/bin/bash
  export DB_NAME=${var.db-name}
  export DB_USER=${var.db-user}
  export DB_PASSWORD=${var.db-password}
  export DB_HOST=${var.db-host}
  export SECRET_KEY=${var.secret-key}
  mkdir -pv /var/{log,run}/gunicorn/
  chown -cR ubuntu:ubuntu /var/{log,run}/gunicorn/
  cd /projects/jam/jam-api
  /home/ubuntu/.pyenv/shims/gunicorn -c gunicorn.conf.py 
  EOF
  vpc_security_group_ids = [ aws_security_group.jam.id ]
  tags = {
    Name = "JAM"
  }
}


resource "aws_eip" "ip" {
  instance = aws_instance.jam.id
  vpc = true
}

resource "aws_route53_record" "jam-api" {
  zone_id = var.hosted-zone-id
  name    = "jam-api.tsdim.net"
  type    = "A"
  ttl     = "300"
  records = [aws_eip.ip.public_ip]
}

resource "aws_route53_record" "jam-api" {
  zone_id = var.hosted-zone-id
  name    = "jam.tsdim.net"
  type    = "A"
  ttl     = "300"
  records = [aws_eip.ip.public_ip]
}
