variable "name" {}
variable "blockchain_cmd" {}
variable "blockchain_conf" {}
variable "ssh_key" {}

variable "size" {
  default = "2gb"
}

variable "blockchain_dir" {
  default = "./scratch/blockchains"
}

data "template_file" "supervisor_conf" {
  template = "${file("./blockchains/supervisor.conf")}"

  vars {
    blockchain = "${var.name}"
    blockchain_cmd = "${var.blockchain_cmd}"
  }
}

resource "digitalocean_droplet" "blockchain_server" {
  image  = "debian-9-x64"
  name   = "${var.name}"
  region = "ams2"
  size   = "${var.size}"
  ssh_keys = ["${var.ssh_key}"]

  connection {
    type     = "ssh"
    user     = "root"
    private_key = "${file("${pathexpand("~/.ssh/id_rsa")}")}"
  }

  provisioner "file" {
    content     = "${data.template_file.supervisor_conf.rendered}"
    destination = "/tmp/supervisor-${var.name}.conf"
  }

  provisioner "file" {
    source      = "${var.blockchain_dir}/${var.blockchain_conf}"
    destination = "/tmp/${var.blockchain_conf}"
  }

  provisioner "remote-exec" {
    script  = "./blockchains/${var.name}/install.sh"
  }
}

output "ip_address" {
  value = "${digitalocean_droplet.blockchain_server.ipv4_address}"
}

