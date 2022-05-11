#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const bip39 = require('bip39')
const setEnvVariable = require('../tools/set-env-var')

require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? path.resolve('/etc', 'lamassu', '.env') : path.resolve(__dirname, '../.env') })

if (process.env.MNEMONIC_PATH && !process.env.SEED_PATH) {
  const mnemonic = fs.readFileSync(process.env.MNEMONIC_PATH, 'utf8')
  const seed = bip39.mnemonicToEntropy(mnemonic.split('\n').join(' ').trim()).toString('hex')

  setEnvVariable('SEED_PATH', path.resolve(os.homedir(), '.lamassu', 'seeds', 'seed.txt'))

  if (!fs.existsSync(path.dirname(process.env.SEED_PATH))) {
    fs.mkdirSync(path.dirname(process.env.SEED_PATH))
  }

  if (!fs.existsSync(process.env.SEED_PATH)) {
    fs.writeFileSync(process.env.SEED_PATH, seed, 'utf8')
  }
}
