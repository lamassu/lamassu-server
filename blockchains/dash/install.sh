#!/usr/bin/env bash
set -e

LOG_FILE=/tmp/install.log

apt-get update -y >> $LOG_FILE 2>&1
apt-get install -y ufw supervisor >> $LOG_FILE 2>&1
ufw allow 8332 >> $LOG_FILE 2>&1
ufw allow 22 >> $LOG_FILE 2>&1
ufw --force enable >> $LOG_FILE 2>&1
ufw status >> $LOG_FILE 2>&1
wget -q https://www.dash.org/binaries/dashcore-0.12.1.5-linux64.tar.gz >> $LOG_FILE 2>&1
tar -xzf dashcore-0.12.1.5-linux64.tar.gz >> $LOG_FILE 2>&1
cp dashcore-0.12.1/bin/* /usr/local/bin >> $LOG_FILE 2>&1
mkdir ~/.dash >> $LOG_FILE 2>&1
mv /tmp/dash.conf ~/.bitocoin
mv /tmp/supervisor-dash.conf /etc/supervisor/conf.d/dash.conf >> $LOG_FILE 2>&1
service supervisor restart >> $LOG_FILE 2>&1
