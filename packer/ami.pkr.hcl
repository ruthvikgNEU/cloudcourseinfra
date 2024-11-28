
variable "aws_region" {
  type    = string
  default = env("AWS_DEFAULT_REGION")
}
variable "source_ami_id" {
  type    = string
  default = env("SOURCE_AMI_ID")
}
variable "ssh_username" {
  type    = string
  default =env("SSH_USERNAME")
}

variable "subnet_id" {
  type    = string
  default = env("DEFAULT_SUBNET_ID")
}
variable "dev_ac" {
  type    = string
  default = env("AWS_DEV_ACCOUNT")
}
variable "demo_ac" {
  type    = string
  default = env("AWS_DEMO_ACCOUNT")
}
source "amazon-ebs" "my-ami" {
  ami_name      = "csye6225_${formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())}"
  source_ami    = "${var.source_ami_id}"
  instance_type = "t2.micro"
  region        = "${var.aws_region}"
  ssh_username  = "${var.ssh_username}"
  ami_users     = ["${var.dev_ac}", "${var.demo_ac}"]
  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/xvda"
    volume_size           = 8
    volume_type           = "gp2"
  }
}

build {
  sources = ["source.amazon-ebs.my-ami"]

  provisioner "file" {
    source      = "webapp.zip"
    destination = "webapp.zip"
  }

  provisioner "shell" {
    script =  "packer/user_data.sh"
  }
}
