const ElectrumClient = require('@photon-sdk/rn-electrum-client')
const NodeCache = require('node-cache')
const _ = require('lodash/fp')
const b58 = require('bs58check')
const bip39 = require('bip39')
const bitcoin = require('bitcoinjs-lib')
const coinselect = require('coinselect')
const ecc = require('tiny-secp256k1')
const ECPair = require('ecpair').default(ecc)
const bip32 = require('bip32').default(ecc)
const mem = require('mem')
const { default: Queue } = require('p-queue')
const { unitScale } = require('@lamassu/coins').utils.getCryptoCurrency('BTC')

const BN = require('../../../bn')
const T = require('../../../time')
const helpers = require('../helpers')
const { PromiseObject } = require('../helpers')
const { loadAccounts } = require('../../../new-settings-loader')


const electrumConsts = loadAccounts().then(_.get('electrum'))

const LAMASSU_VERSION = require('../../../../package.json').version
const LAMASSU_CLIENT = "Lamassu Electrum Client " + LAMASSU_VERSION
const ELECTRUM_PROTOCOL_VERSION = "1.4"
const electrumPromise = electrumConsts
  .then(({ host, port, protocol }) => {
    const electrum = new ElectrumClient(port, host, protocol)
    electrum.initElectrum({
      client: LAMASSU_CLIENT,
      version: ELECTRUM_PROTOCOL_VERSION
    })
    return electrum
  })

const networkPromise = electrumConsts
  .then(({ network }) => ({
    main: bitcoin.networks['bitcoin'],
    test: bitcoin.networks['testnet'],
    regtest: bitcoin.networks['regtest'],
  })[network])

/* Close the client connection when the server is about to end. */
_.each(ev => process.once(ev, () => {
  electrumPromise
    .then(electrum => electrum.close())
    .finally(() => process.exit(0))
}), ['SIGINT', 'SIGTERM', 'exit'])

/*
 * BIP-125 (§Summary, "Explicit signaling") says any sequence number less than
 * 0xffffffff-1 explicitly signals RBF. There's also PR#6871 of Bitcoin Core[0]
 * (linked to from BIP-125).
 *
 * [0]: https://github.com/bitcoin/bitcoin/blob/0e935865b9ee3a79fc63f5766074b6f539a0cf85/src/main.cpp#L845-L865
 *
 * This is the maximum valid sequence number with RBF on:
 * `seq <= MAX_RBF_SEQ_NUMBER` means RBF is on, and
 * `seq > MAX_RBF_SEQ_NUMBER` means RBF is off
 */
const MAX_RBF_SEQ_NUMBER = 0xffffffff-2

/* 0x00000000 is the fingerprint of the master key (BIP-32, §Serialization format). */
const MASTER_FINGERPRINT = Buffer.from([0x00, 0x00, 0x00, 0x00])

const mnemonic = helpers.readMnemonic()
const wallet_hash = helpers.computeWalletHash(mnemonic)

const GAP_LIMIT = 20
const CHUNK_SIZE = 50


const freeAddressIndices = () =>
  helpers.freeAddressIndices('BTC', wallet_hash, ['internal', 'external'])

/* Retrieves the next {in,ex}ternal free index */
const _nextFreeAddressIndex = (type) => () => freeAddressIndices().then(_.get(type))
const nextFreeInternalAddressIndex = _nextFreeAddressIndex('internal')
const nextFreeExternalAddressIndex = _nextFreeAddressIndex('external')

const _nextFreeAddress = type => network =>
  helpers.nextFreeIndex('BTC', wallet_hash, type)
    .then(({ index }) => _getInternalAddressByIndex(index, network))

/*
 * Computes the {in,ex}ternal addresses of the next free indices. External
 * addresses are used for funding, while internal ones are used for change.
 * NOTE: Automatically increments the stored index!
 */
const nextFreeInternalAddress = _nextFreeAddress('internal')
const nextFreeExternalAddress = _nextFreeAddress('external')


const balance2BN = balance => new BN(balance).decimalPlaces(0)

const scriptHashFromAddress = network => _.flow(
  address => bitcoin.address.toOutputScript(address, network),
  bitcoin.crypto.sha256,
  hash => hash.reverse(),
  Buffer.from,
  buf => buf.toString('hex'),
)


const nodeToBech32SegwitAddress = (hdNode, network) =>
  bitcoin.payments.p2wpkh({
    pubkey: hdNode.publicKey,
    network,
  }).address


const get_xpub = network => {
  const seed = bip39.mnemonicToSeed(mnemonic)
  const root = bip32.fromSeed(seed, network)

  const path = "m/84'/0'/0'"
  const child = root.derivePath(path).neutered()
  return child.toBase58()
}

const get_pub = network => ({ xpub: get_xpub(network) })

// node = 0 => external
// node = 1 => internal
const _getNodeAddressByIndex = (node, index, network) => {
  index = index * 1 // cast to int

  const { xpub } = get_pub(network)
  const hdNode = bip32.fromBase58(xpub, network)
  const node0 = hdNode.derive(node)

  return nodeToBech32SegwitAddress(node0.derive(index), network)
}

const _getExternalAddressByIndex = (index, network) => _getNodeAddressByIndex(0, index, network)
const _getInternalAddressByIndex = (index, network) => _getNodeAddressByIndex(1, index, network)

const _getWIFByIndex = (internal, index, network) => {
  const seed = bip39.mnemonicToSeed(mnemonic)
  const root = bip32.fromSeed(seed, network)
  const path = `m/84'/0'/0'/${internal ? 1 : 0}/${index}`
  const child = root.derivePath(path)

  return child.toWIF()
}

const _getExternalWIFByIndex = (index, network) => _getWIFByIndex(false, index, network)
const _getInternalWIFByIndex = (index, network) => _getWIFByIndex(true, index, network)

const _getWifForAddress = (address, network) =>
  freeAddressIndices()
    .then(({ internal, external }) => {
      for (let c = 0; c <= internal + GAP_LIMIT; c++)
        if (_getInternalAddressByIndex(c, network) === address)
          return _getInternalWIFByIndex(c, network)

      for (let c = 0; c <= external + GAP_LIMIT; c++)
        if (_getExternalAddressByIndex(c, network) === address)
          return _getExternalWIFByIndex(c, network)

      return Promise.reject(new Error('Could not find WIF for ' + address))
    })


const setConsumedIndices = indices =>
  helpers.setConsumedIndices('BTC', wallet_hash, indices)
const unsetConsumedIndices = indices =>
  helpers.unsetConsumedIndices('BTC', wallet_hash, indices)
const getConsumedIndices = types =>
  helpers.getConsumedIndices('BTC', wallet_hash, types)
const getConsumedIndicesChunk = (chunkSize=CHUNK_SIZE) =>
  helpers.getConsumedIndicesChunk('BTC', wallet_hash, ['internal', 'external'], chunkSize)

const enumerateIndices = ({ internal, external }) => ({
  internal: _.range(0, internal + GAP_LIMIT),
  external: _.range(0, external + GAP_LIMIT),
})

const filterUnconsumedIndices = indices => _.flow(
  _.update('internal', all => _.difference(all, indices.internal)),
  _.update('external', all => _.difference(all, indices.external)),
)

const nonConsumedIndices = allIndices =>
  getConsumedIndices(['internal', 'external'])
    .then(indices => _.flow(
      enumerateIndices,
      filterUnconsumedIndices(indices),
    )(allIndices))

const fetchAllUTXOs = network => freeAddressIndices()
  .then(nonConsumedIndices)
  .then(fetchUTXOsForIndices(network))

const fetchUTXOsForIndices = network => _.flow(
  _.update('internal', _.map(c => ({
    addressType: 'internal',
    addressIndex: c,
    address: _getInternalAddressByIndex(c, network),
  }))),
  _.update('external', _.map(c => ({
    addressType: 'external',
    addressIndex: c,
    address: _getExternalAddressByIndex(c, network),
  }))),
  ({ internal, external }) => _.concat(internal, external),
  getUTXOsBatch(network),
)

const fetchConfirmedUTXOs = network => fetchAllUTXOs(network).then(_.filter(_.get('confirmed')))
const fetchUnconfirmedUTXOs = network => fetchAllUTXOs(network).then(_.remove(_.get('confirmed')))

const sumUTXOs = _.reduce((ret, { value }) => ret.plus(value), new BN(0))

// TODO: Use `blockchainScripthash_getBalance` instead of summing UTXOs
const getAllBalance = network => fetchAllUTXOs(network).then(sumUTXOs)
const getConfirmedBalance = network => fetchConfirmedUTXOs(network).then(sumUTXOs)
const getUnconfirmedBalance = network => fetchUnconfirmedUTXOs(network).then(sumUTXOs)

const getAddressBalance = address =>
  PromiseObject({ electrum: electrumPromise, network: networkPromise })
  .then(({ electrum, network }) =>
    electrum.blockchainScripthash_getBalance(scriptHashFromAddress(network)(address)))
  .then(_.flow(
    _.update('confirmed', balance2BN),
    _.update('unconfirmed', balance2BN), // Doesn't include confirmed balance
    obj => _.set('all', obj.confirmed.plus(obj.unconfirmed), obj),
  ))


const checkCryptoCode = cryptoCode =>
  cryptoCode === 'BTC' ?
    Promise.resolve() :
    Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))


const getUTXOsBatch = network => addressInfos => {
  const scriptHashes = _.map(
    _.flow(_.get('address'), scriptHashFromAddress(network)),
    addressInfos
  )
  const scriptHash2addrInfo = _.fromPairs(_.zip(scriptHashes, addressInfos))
  return electrumPromise
    .then(electrum =>
      Promise.all(_.flow(
        _.chunk(CHUNK_SIZE),
        _.map(chunk => electrum.blockchainScripthash_listunspentBatch(chunk)),
      )(scriptHashes))
      .then(_.flow(
        _.flatten,
        _.flatMap(({ param: scriptHash, result }) => _.map(
          _.flow(
            utxo => _.set('txId', utxo.tx_hash, utxo),
            _.unset('tx_hash'),
            utxo => _.set('vout', utxo.tx_pos, utxo),
            _.unset('tx_pos'),
            utxo => _.set('confirmed', utxo.height !== 0, utxo),
            _.assign(scriptHash2addrInfo[scriptHash]),
          ),
          result)))))
}


/*
 * @brief Creates a complete transaction to @a outputs
 * @param outputs Array of objects { address, value }
 * @param feeMultiplier Multiplier to apply to the estimated fee rate
 *
 * `value` of @a outputs is in crypto atoms.
 */
const makeTransactionTo = (outputs, feeMultiplier) =>
  PromiseObject({
    feeRate: estimateFee().then(_.flow(_.multiply(feeMultiplier), Math.round)),
    network: networkPromise,
  })
  .then(o =>
    fetchConfirmedUTXOs(o.network)
      .then(_.flow(
        _.sortBy(_.get('value')),
        utxos => _.set('utxos', utxos, o),
        _.set('outputs', _.map(_.update('value', bn => bn.toNumber()), outputs)),
        ({ utxos, outputs, feeRate, network }) => createTransaction(utxos, outputs, feeRate, network),
      )))

const _getNodePubkeyByIndex = (node, index, network) => {
  index = index * 1 // cast to int
  const { xpub } = get_pub(network)
  const hdNode = bip32.fromBase58(xpub, network)
  const node0 = hdNode.derive(node)
  return node0.derive(index).publicKey
}

const _getPubkeyByAddress = (address, network) =>
  freeAddressIndices()
    .then(({ internal, external }) => {
      for (let c = 0; c < external + GAP_LIMIT; c++)
        if (_getExternalAddressByIndex(c, network) === address)
          return _getNodePubkeyByIndex(0, c, network)

      for (let c = 0; c < internal + GAP_LIMIT; c++)
        if (_getInternalAddressByIndex(c, network) === address)
          return _getNodePubkeyByIndex(1, c, network)

      return Promise.reject(null)
    })

const _getDerivationPathByAddress = (address, network, BIP = 84) =>
  freeAddressIndices()
    .then(({ internal, external }) => {
      const path = `m/${BIP}'/0'/0'`
      for (let c = 0; c < external + GAP_LIMIT; c++)
        if (_getExternalAddressByIndex(c, network) === address)
          return path + '/0/' + c

      for (let c = 0; c < internal + GAP_LIMIT; c++)
        if (_getInternalAddressByIndex(c, network) === address)
          return path + '/1/' + c

      return Promise.reject(null)
    })

// Mustn't use promises inside
const _addPsbtInput = (psbt, input, pubkey, script, path, sequence, fingerprint) => {
  const { txId: hash, vout: index, address, value } = input
  const masterFingerprint = fingerprint || MASTER_FINGERPRINT

  psbt.addInput({
    hash,
    index,
    sequence,
    bip32Derivation: [{ masterFingerprint, path, pubkey }],
    witnessUtxo: { script, value },
  })

  return psbt
}

/*
 * The docs say the result is in BTC/kB, but coinselect wants sat/B. In case
 * the server can't provide an estimate, -1 is returned.
 *
 * https://electrumx-spesmilo.readthedocs.io/en/latest/protocol-methods.html#blockchain-estimatefee
 */
const BTCperkB2satperB = x => new BN(x).shiftedBy(unitScale-3)
const _estimateFee = () =>
  electrumPromise
    .then(electrum => electrum.blockchainEstimatefee(6))
    .then(feeRate => feeRate === -1 ?
      Promise.reject(new Error('No available fee estimate')) :
      BTCperkB2satperB(feeRate).toNumber())

// TODO: What if the thing is rejected?
const estimateFee = mem(_estimateFee, { maxAge: T.hour })

const recentlyUsedUTXOs = new NodeCache({
  stdTTL: 60,
  checkperiod: 600,
  useClones: false,
})

const UTXOKey = ({ txId, vout }) => JSON.stringify([txId, vout])
const UTXOsUniqueAddresses = _.flow(_.map(_.pick(['addressIndex', 'addressType'])), _.uniq)

const updateTables = (utxos, selectedInputs) => {
  const isSameUTXO = (a, b) => a.txId === b.txId && a.vout === b.vout

  const indicesBefore = UTXOsUniqueAddresses(utxos)

  // all UTXOs - used UTXOs
  const indicesAfter = UTXOsUniqueAddresses(_.differenceWith(isSameUTXO, utxos, selectedInputs))

  // unconsumed addresses before - unconsumed addresses after
  const newlyConsumedIndices = _.difference(indicesBefore, indicesAfter)
  setConsumedIndices(newlyConsumedIndices)

  // Mark used UTXOs as recently used
  recentlyUsedUTXOs.mset(
    _.map(utxo => ({ key: UTXOKey(utxo), val: true }), selectedInputs)
  )
}

/*
 * @brief Create a signed transaction for the given inputs and outputs
 * @param utxos An array of UTXOs: [{ txId, vout, address, value }, ...]
 * @param outputs An array of recipients: [{ toAddress, cryptoAtoms }, ...]
 * @param feeRate The fee rate to use for the transaction
 * @param network The network constants
 * @returns A signed transaction
 */
const createTransaction = (utxos, outputs, feeRate, network) => {
  // Ignore UTXOs that we've used in the past ~1min
  let inputs = _.remove(utxo => recentlyUsedUTXOs.has(UTXOKey(utxo)), utxos)

  const selected = coinselect(inputs, outputs, feeRate)
  if (!selected.inputs || !selected.outputs)
    return Promise.reject(new Error("Couldn't select coins"))

  // Gather all the necessary details for each input
  inputs = Promise.all(_.map(
    input =>
      !input.address ?
        Promise.reject(new Error('Internal error: no address')) :
        PromiseObject({
          input,

          // Key to sign this input
          key: _getWifForAddress(input.address, network)
            .then(wif => ECPair.fromWIF(wif, network)),

          // `pubkey`, `script` & `path` are used when adding this input to the PSBT
          pubkey: _getPubkeyByAddress(input.address, network),
          path: _getDerivationPathByAddress(input.address, network),
        })
        .then(o =>
          _.flow(
            _.get('pubkey'),
            pubkey => ({ pubkey, network }),
            p => bitcoin.payments.p2wpkh(p),
            _.get('output'),
            script => _.set('script', script, o),
          )(o)),
    selected.inputs
  ))

  // Gather all the necessary details for each output
  outputs = Promise.all(_.map(
    ({ address, value }) =>
      Promise.resolve(!address)
        .then(isChangeOutput =>
          isChangeOutput ?
            nextFreeInternalAddress(network)
              .then(address => ({ address, value, isChangeOutput })) :
            ({ address, value, isChangeOutput }))
        .then(({ address, value, isChangeOutput }) =>
          isChangeOutput ?
            PromiseObject({
              masterFingerprint: MASTER_FINGERPRINT,
              path: _getDerivationPathByAddress(address, network),
              pubkey: _getPubkeyByAddress(address, network),
            })
            .then(_.flow(
              x => [x],
              bip32Derivation => ({ address, value, bip32Derivation }),
            )) :
            ({ address, value })),
    selected.outputs
  ))

  // Add all inputs & outputs and sign the inputs
  return PromiseObject({ inputs, outputs })
    .then(({ inputs, outputs }) => {
      const sequence = 0
      const psbt = new bitcoin.Psbt({ network })

      inputs.forEach(({ input, pubkey, script, path }) => _addPsbtInput(psbt, input, pubkey, script, path, sequence))
      outputs.forEach(output => psbt.addOutput(output))
      inputs.forEach(({ key }, idx) => psbt.signInput(idx, key))

      updateTables(
        utxos,
        selected.inputs,
      )

      return psbt.finalizeAllInputs().extractTransaction()
    })
}


/*
 * @brief Broadcasts a transaction through an Electrum server
 * @param tx A signed transaction as returned by `createTransaction()`
 * @returns The transaction hash
 */
const broadcastTx = tx =>
  electrumPromise
    .then(electrum => electrum.blockchainTransaction_broadcast(tx.toHex()))

const SUPPORTS_BATCHING = true

const balance = (account, cryptoCode, settings, operatorId) =>
  checkCryptoCode(cryptoCode)
    .then(() => networkPromise)
    .then(getConfirmedBalance)
    .then(balance2BN)

const cryptoNetwork = (account, cryptoCode, settings, operatorId) =>
  checkCryptoCode(cryptoCode).then(() => electrumConsts).then(_.get('network'))

const fetchRBF = txId =>
  /*
   * NOTE: Even though the docs[0] say that with `verbose=true` the result is
   * what the specific daemon (bitcoind in this case) would return, the
   * returned object doesn't have any `bip125-replaceable` key. Instead, the
   * inputs (`vin`) have the sequence number (`sequence`), that we can use to
   * determine if RBF is enabled or not (according to the relevant BIPs).
   *
   * [0]: https://electrumx-spesmilo.readthedocs.io/en/latest/protocol-methods.html#blockchain-transaction-get
   */
  electrumPromise
    .then(electrum => electrum.blockchainTransaction_get(txId, true))
    .then(_.flow(
      _.get('vin'),
      _.any(tx => tx.sequence <= MAX_RBF_SEQ_NUMBER)))

const getStatus = (account, { toAddress, cryptoCode }, requested, settings, operatorId) =>
  checkCryptoCode(cryptoCode)
    .then(() => getAddressBalance(toAddress))
    .then(({ confirmed, all }) => ({
      receivedCryptoAtoms: confirmed.gte(requested) ? confirmed : all,
      status: confirmed.gte(requested) ? 'confirmed' :
              all.gte(requested) ? 'authorized' :
              all.gt(0) ? 'insufficientFunds' :
              'notSeen'
    }))

const newAddress = (account, { cryptoCode }, tx, settings, operatorId) =>
  checkCryptoCode(cryptoCode)
    .then(() => networkPromise)
    .then(nextFreeExternalAddress)


const newFunding = (account, cryptoCode, settings, operatorId) =>
  checkCryptoCode(cryptoCode)
    .then(() => networkPromise)
    .then(network => PromiseObject({
      fundingPendingBalance: getUnconfirmedBalance(network),
      fundingConfirmedBalance: getConfirmedBalance(network),
      fundingAddress: newAddress(account, { cryptoCode }, null, settings, operatorId),
    }))


const SEND_QUEUE = new Queue({ concurrent: 1 })

const _send = (cryptoCode, txs, feeMultiplier) =>
  checkCryptoCode(cryptoCode)
    .then(() =>
      SEND_QUEUE.add(() =>
        makeTransactionTo(txs, feeMultiplier).then(broadcastTx)
      ))

const sendCoins = (account, { toAddress, cryptoAtoms, cryptoCode }, settings, operatorId, feeMultiplier) =>
  _send(cryptoCode, [{ address: toAddress, value: cryptoAtoms }], feeMultiplier)

const sendCoinsBatch = (account, txs, cryptoCode, feeMultiplier) => {
  txs = _.map(_.mapKeys(k => ({ toAddress: 'address', cryptoAtoms: 'value' })[k]), txs)
  return _send(cryptoCode, txs, feeMultiplier)
}


const checkConsumedAddresses = () =>
  PromiseObject({
    network: networkPromise,
    // Since these addresses aren't supposed to have any UTXOs it should be
    // safe to ask for more than the usual amount
    indices: getConsumedIndicesChunk(2*CHUNK_SIZE),
  })
  .then(({ network, indices }) => PromiseObject({
    indicesToUnset: fetchUTXOsForIndices(network)(indices).then(UTXOsUniqueAddresses),
    indices,
  }))
  .then(({ indicesToUnset, indices }) => PromiseObject({
    // Unset addresses that were previously set as consumed
    unset: !_.isEmpty(indicesToUnset) && unsetConsumedIndices(indicesToUnset),
    // Take the addresses that are still consumed to update the `last_check`
    indicesToSet: _.difference(indices, indicesToUnset),
  }))
  .then(({ indicesToSet }) => !_.isEmpty(indicesToSet) && setConsumedIndices(indicesToSet))


module.exports = {
  SUPPORTS_BATCHING,
  balance,
  cryptoNetwork,
  fetchRBF,
  getStatus,
  newAddress,
  newFunding,
  sendCoins,
  sendCoinsBatch,

  checkConsumedAddresses,
}
