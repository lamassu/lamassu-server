#!/usr/bin/env bash
set -e

LOG_FILE=/tmp/install.log

wget -q $UPGRADE_URL >> $LOG_FILE 2>&1
tar -xzf $UPGRADE_PACKAGE >> $LOG_FILE 2>&1
supervisorctl stop zcash >> $LOG_FILE 2>&1
cp $UPGRADE_PACKAGE/bin/* /usr/local/bin/ >> $LOG_FILE 2>&1
supervisorctl start zcash >> $LOG_FILE 2>&1

