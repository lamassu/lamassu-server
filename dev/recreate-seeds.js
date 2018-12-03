#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const bip39 = require('bip39')
const options = require('../lib/options-loader')()

if (options.opts.mnemonicPath && !options.opts.seedPath) {
  const mnemonic = fs.readFileSync(options.opts.mnemonicPath, 'utf8')
  const seed = bip39.mnemonicToEntropy(mnemonic.split('\n').join(' ').trim()).toString('hex')

  options.opts.seedPath = path.resolve(os.homedir(), '.lamassu', 'seeds', 'seed.txt')

  if (!fs.existsSync(path.dirname(options.opts.seedPath))) {
    fs.mkdirSync(path.dirname(options.opts.seedPath))
  }

  if (!fs.existsSync(options.opts.seedPath)) {
    fs.writeFileSync(options.opts.seedPath, seed, 'utf8')
  }

  fs.writeFileSync(options.path, JSON.stringify(options.opts, null, '\t'), 'utf8')
}
