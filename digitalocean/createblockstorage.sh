#!/bin/bash
set -e

if [ $# -eq 0 ]
  then
    echo "usage: bash createblockstorage.sh [droplet-name]" && exit 1
fi

DROPLET_NAME=$1

#Install doctl

echo "Installing doctl..."

sudo snap install doctl

#Create config folder as suggested in doctl documentation

sudo mkdir -p ~/.config

#Access doctl account

echo "Accessing digital ocean account..."
doctl auth init --context data-migration
doctl auth switch --context data-migration

#Get droplet region and id
echo "Fetching droplet information..."

DROPLET_INFO=$(doctl compute droplet get $DROPLET_NAME --format "ID, Region")
DROPLET_ID=$(echo $DROPLET_INFO | awk '{ print $3; }')
REGION=$(echo $DROPLET_INFO | awk '{ print $4; }')

#Create a new volume and attach it to the droplet
echo "Creating a new volume..."
VOLUME_ID=$(doctl compute volume create --region $REGION --size 10GiB lamassu-data --format "ID" | sed -n 2p)

echo "Attaching to the droplet..."
doctl compute volume-action attach $VOLUME_ID $DROPLET_ID

#Create partition and format
echo
echo "Creating a new partition..."
echo


sudo apt-get update
yes | sudo apt-get install parted

sudo parted /dev/disk/by-id/scsi-0DO_Volume_lamassu-data mklabel gpt
sudo parted -a opt /dev/disk/by-id/scsi-0DO_Volume_lamassu-data mkpart primary ext4 0% 100%

echo
echo "Formatting the new volume..."
echo

sleep 4
sudo mkfs.ext4 -L lamassudata /dev/disk/by-id/scsi-0DO_Volume_lamassu-data-part1

#Mounting the new volume
echo
echo "Mounting the new volume..."
echo

sudo mkdir -p /mnt/lamassu-data
sudo mount -o defaults,nofail,discard,noatime /dev/disk/by-id/scsi-0DO_Volume_lamassu-data-part1 /mnt/lamassu-data

#Persistent mounting
echo "/dev/disk/by-id/scsi-0DO_Volume_lamassu-data-part1    /mnt/lamassu-data    ext4    defaults,nofail,discard,noatime    0 2" | sudo tee -a /etc/fstab

echo
echo "New block storage volume successfully installed!"
echo "Can be accessed at: /mnt/lamassu-data"
echo
