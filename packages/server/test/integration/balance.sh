#!/bin/bash

PREFIX_W1='docker exec --user bitcoin bitcoin-server bitcoin-cli -rpcwallet=wallet1.dat -regtest '
PREFIX_W2='docker exec --user bitcoin bitcoin-server bitcoin-cli -rpcwallet=wallet2.dat -regtest '

# Create address and generate mine blocks
ADDRESS_1=`$PREFIX_W1 getnewaddress`
ADDRESS_2=`$PREFIX_W2 getnewaddress`
$PREFIX_W1 generatetoaddress 101 $ADDRESS_1 > /dev/null 2>&1

echo -e 'Wallet 1 balance'
$PREFIX_W1 getwalletinfo | grep balance

echo -e '\nWallet 2 balance'
$PREFIX_W2 getwalletinfo | grep balance

# Wallet one has one UTXO, so this also tests change
echo -e '\n\nCreate send\n'
$PREFIX_W1 sendtoaddress $ADDRESS_2 0.3 > /dev/null 2>&1

echo -e 'Wallet 1 balance'
$PREFIX_W1 getwalletinfo | grep balance

echo -e '\nWallet 2 balance'
$PREFIX_W2 getwalletinfo | grep balance

echo -e '\n\nMine one block \n'
$PREFIX_W1 generatetoaddress 1 $ADDRESS_1 > /dev/null 2>&1

echo -e 'Wallet 1 balance'
$PREFIX_W1 getwalletinfo | grep balance

echo -e '\nWallet 2 balance'
$PREFIX_W2 getwalletinfo | grep balance

