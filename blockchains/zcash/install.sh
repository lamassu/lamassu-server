#!/usr/bin/env bash
set -e

LOG_FILE=/tmp/install.log

apt-get update -y >> $LOG_FILE 2>&1
apt-get install -y ufw supervisor libgomp1 >> $LOG_FILE 2>&1
ufw allow 8233 >> $LOG_FILE 2>&1
ufw allow 22 >> $LOG_FILE 2>&1
ufw --force enable >> $LOG_FILE 2>&1
ufw status >> $LOG_FILE 2>&1
wget -q https://z.cash/downloads/zcash-1.0.10-1-linux64.tar.gz >> $LOG_FILE 2>&1
tar -xzf zcash-1.0.10-1-linux64.tar.gz >> $LOG_FILE 2>&1
cp zcash-1.0.10-1/bin/* /usr/local/bin >> $LOG_FILE 2>&1
zcash-fetch-params >> $LOG_FILE 2>&1
mkdir ~/.zcash >> $LOG_FILE 2>&1
mv /tmp/zcash.conf ~/.zcash
mv /tmp/supervisor-zcash.conf /etc/supervisor/conf.d/zcash.conf >> $LOG_FILE 2>&1
service supervisor restart >> $LOG_FILE 2>&1
