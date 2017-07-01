#!/usr/bin/env bash
set -e

LOG_FILE=/tmp/install.log

apt-get update -y >> $LOG_FILE 2>&1
apt-get install -y ufw supervisor >> $LOG_FILE 2>&1
ufw allow 8332 >> $LOG_FILE 2>&1
ufw allow 22 >> $LOG_FILE 2>&1
ufw --force enable >> $LOG_FILE 2>&1
ufw status >> $LOG_FILE 2>&1
wget -q https://download.litecoin.org/litecoin-0.13.2/linux/litecoin-0.13.2-x86_64-linux-gnu.tar.gz >> $LOG_FILE 2>&1
tar -xzf litecoin-0.13.2-x86_64-linux-gnu.tar.gz >> $LOG_FILE 2>&1
cp litecoin-0.13.2/bin/* /usr/local/bin >> $LOG_FILE 2>&1
mkdir ~/.litecoin >> $LOG_FILE 2>&1
mv /tmp/litecoin.conf ~/.litecoin
mv /tmp/supervisor-litecoin.conf /etc/supervisor/conf.d/litecoin.conf >> $LOG_FILE 2>&1
service supervisor restart >> $LOG_FILE 2>&1
