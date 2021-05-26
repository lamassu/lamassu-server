#!/bin/bash
set -e

echo
echo "Initializing data migration to the new block storage volume..."
echo

NEW_VOLUME_MOUNTING_POINT=/mnt/lamassu-data

CERT_DIR=/etc/ssl/certs
KEY_DIR=/etc/ssl/private
CONFIG_DIR=/etc/lamassu

LAMASSU_CA_PATH=$CERT_DIR/Lamassu_CA.pem
CA_KEY_PATH=$KEY_DIR/Lamassu_OP_Root_CA.key
CA_PATH=$CERT_DIR/Lamassu_OP_Root_CA.pem
SERVER_KEY_PATH=$KEY_DIR/Lamassu_OP.key
SERVER_CERT_PATH=$CERT_DIR/Lamassu_OP.pem
MNEMONIC_DIR=$CONFIG_DIR/mnemonics 
MNEMONIC_FILE=$MNEMONIC_DIR/mnemonic.txt 
BACKUP_DIR=/var/backups/postgresql
BLOCKCHAIN_DIR=/mnt/blockchains
OFAC_DATA_DIR=/var/lamassu/ofac
ID_PHOTO_CARD_DIR=/opt/lamassu-server/idphotocard
FRONTCAMERA_DIR=/opt/lamassu-server/frontcamera

mkdir -p $NEW_VOLUME_MOUNTING_POINT$CERT_DIR
mkdir -p $NEW_VOLUME_MOUNTING_POINT$KEY_DIR
mkdir -p $NEW_VOLUME_MOUNTING_POINT$MNEMONIC_DIR
mkdir -p $NEW_VOLUME_MOUNTING_POINT/var/backups
mkdir -p $NEW_VOLUME_MOUNTING_POINT/mnt
mkdir -p $NEW_VOLUME_MOUNTING_POINT/var/lamassu
mkdir -p $NEW_VOLUME_MOUNTING_POINT/opt/lamassu-server

if [ -f $LAMASSU_CA_PATH ]; 
then
   cp $LAMASSU_CA_PATH $NEW_VOLUME_MOUNTING_POINT$CERT_DIR
   echo "Successfully migrated $LAMASSU_CA_PATH"
else 
   echo "Failed to migrate $LAMASSU_CA_PATH, file doesn't exist!"
fi

if [ -f $CA_KEY_PATH ]; 
then
   cp $CA_KEY_PATH $NEW_VOLUME_MOUNTING_POINT$KEY_DIR
   echo "Successfully migrated $CA_KEY_PATH"
else 
   echo "Failed to migrate $CA_KEY_PATH, file doesn't exist!"
fi

if [ -f $CA_PATH ]; 
then
   cp $CA_PATH $NEW_VOLUME_MOUNTING_POINT$CERT_DIR
   echo "Successfully migrated $CA_PATH"
else 
   echo "Failed to migrate $CA_PATH, file doesn't exist!"
fi

if [ -f $SERVER_KEY_PATH ]; 
then
   cp $SERVER_KEY_PATH $NEW_VOLUME_MOUNTING_POINT$KEY_DIR
   echo "Successfully migrated $SERVER_KEY_PATH"
else 
   echo "Failed to migrate $SERVER_KEY_PATH, file doesn't exist!"
fi

if [ -f $SERVER_CERT_PATH ]; 
then
   cp $SERVER_CERT_PATH $NEW_VOLUME_MOUNTING_POINT$CERT_DIR
   echo "Successfully migrated $SERVER_CERT_PATH"
else 
   echo "Failed to migrate $SERVER_CERT_PATH, file doesn't exist!"
fi

if [ -f $MNEMONIC_FILE ]; 
then
   cp $MNEMONIC_FILE $NEW_VOLUME_MOUNTING_POINT$MNEMONIC_DIR
   echo "Successfully migrated $MNEMONIC_FILE"
else 
   echo "Failed to migrate $MNEMONIC_FILE, file doesn't exist!"
fi

if [ -d $BACKUP_DIR ]; 
then
   cp -r $BACKUP_DIR $NEW_VOLUME_MOUNTING_POINT/var/backups
   echo "Successfully migrated $BACKUP_DIR"
else 
   echo "Failed to migrate $BACKUP_DIR, directory doesn't exist!"
fi

if [ -d $BLOCKCHAIN_DIR ]; 
then
   cp -r $BLOCKCHAIN_DIR $NEW_VOLUME_MOUNTING_POINT/mnt
   echo "Successfully migrated $BLOCKCHAIN_DIR"
else 
   echo "Failed to migrate $BLOCKCHAIN_DIR, directory doesn't exist!"
fi

if [ -d $OFAC_DATA_DIR ]; 
then
   cp -r $OFAC_DATA_DIR $NEW_VOLUME_MOUNTING_POINT/var/lamassu
   echo "Successfully migrated $OFAC_DATA_DIR"
else 
   echo "Failed to migrate $OFAC_DATA_DIR, directory doesn't exist!"
fi

if [ -d $ID_PHOTO_CARD_DIR ]; 
then
   cp -r $ID_PHOTO_CARD_DIR $NEW_VOLUME_MOUNTING_POINT/opt/lamassu-server
   echo "Successfully migrated $ID_PHOTO_CARD_DIR"
else 
   echo "Failed to migrate $ID_PHOTO_CARD_DIR, directory doesn't exist!"
fi

if [ -d $FRONTCAMERA_DIR ]; 
then
   cp -r $FRONTCAMERA_DIR $NEW_VOLUME_MOUNTING_POINT/opt/lamassu-server
   echo "Successfully migrated $FRONTCAMERA_DIR"
else 
   echo "Failed to migrate $FRONTCAMERA_DIR, directory doesn't exist!"
fi


echo "Migration completed!"










