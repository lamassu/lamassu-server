#!/usr/bin/env bash
set -e

LOG_FILE=/tmp/install.log

apt-get update -y >> $LOG_FILE 2>&1
apt-get install -y ufw supervisor >> $LOG_FILE 2>&1
ufw allow 8233 >> $LOG_FILE 2>&1
ufw allow 22 >> $LOG_FILE 2>&1
ufw --force enable >> $LOG_FILE 2>&1
ufw status >> $LOG_FILE 2>&1
wget -q https://download.bitcoinabc.org/0.16.0/linux/bitcoin-abc-0.16.0-x86_64-linux-gnu.tar.gz >> $LOG_FILE 2>&1
tar -xzf bitcoin-abc-0.16.0-x86_64-linux-gnu.tar.gz >> $LOG_FILE 2>&1
cp bitcoin-abc-0.16.0/bin/bitcoind /usr/local/bin/bitcoincashd >> $LOG_FILE 2>&1
cp bitcoin-abc-0.16.0/bin/bitcoin-cli /usr/local/bin/bitcoincash-cli >> $LOG_FILE 2>&1
mkdir ~/.bitcoincash >> $LOG_FILE 2>&1
mv /tmp/bitcoincash.conf ~/.bitcoincash
mv /tmp/supervisor-bitcoincash.conf /etc/supervisor/conf.d/bitcoincash.conf >> $LOG_FILE 2>&1
service supervisor restart >> $LOG_FILE 2>&1
