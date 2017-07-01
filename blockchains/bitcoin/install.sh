#!/usr/bin/env bash
set -e

LOG_FILE=/tmp/install.log

apt-get update -y >> $LOG_FILE 2>&1
apt-get install -y ufw supervisor >> $LOG_FILE 2>&1
ufw allow 8332 >> $LOG_FILE 2>&1
ufw allow 22 >> $LOG_FILE 2>&1
ufw --force enable >> $LOG_FILE 2>&1
ufw status >> $LOG_FILE 2>&1
wget -q https://bitcoin.org/bin/bitcoin-core-0.14.2/bitcoin-0.14.2-x86_64-linux-gnu.tar.gz >> $LOG_FILE 2>&1
tar -xzf bitcoin-0.14.2-x86_64-linux-gnu.tar.gz >> $LOG_FILE 2>&1
cp bitcoin-0.14.2/bin/* /usr/local/bin >> $LOG_FILE 2>&1
mkdir ~/.bitcoin >> $LOG_FILE 2>&1
mv /tmp/bitcoin.conf ~/.bitcoin
mv /tmp/supervisor-bitcoin.conf /etc/supervisor/conf.d/bitcoin.conf >> $LOG_FILE 2>&1
service supervisor restart >> $LOG_FILE 2>&1
