const BN = require("../../../bn");

const E = require("../../../error");

const CryptxPlugin = require("./plugin");

const NAME = "CryptX";
const SUPPORTED_COINS = ["BTC", "LTC", "BCH", "ETH"];

const addressFormats = {
  BTC: "P2SH_SEGWIT",
  LTC: "LEGACY",
  BCH: "CASH_ADDRESS",
  ETH: null,
};

function buildCryptx(account, cryptoCode) {
  const env = account.environment === "production" ? "production" : "test";
  const token = account.token.trim();
  const coin =
    env === "test" ? `t${cryptoCode.toLowerCase()}` : cryptoCode.toLowerCase();
  const walletId = account[`${cryptoCode}WalletId`];

  const Cryptx = new CryptxPlugin({ env, token });

  return {
    getBalance() {
      return Cryptx.getWalletBalance({ coin, walletId });
    },
    send(params) {
      return Cryptx.sendTransaction({
        coin,
        walletId,
        address: params.address,
        value: params.value,
      });
    },
    createAddress(params) {
      return Cryptx.createAddress({
        coin,
        walletId,
        name: params.name,
        addressFormat: params.addressFormat,
      });
    },
    addressBalance(params) {
      return Cryptx.getBalanceOnAddress({
        coin,
        walletId,
        address: params.address,
        minConf: params.minConf,
      });
    },
  };
}

function checkCryptoCode(cryptoCode) {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error("Unsupported crypto: " + cryptoCode));
  }

  return Promise.resolve();
}

function sendCoins(account, address, cryptoAtoms, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      const params = { address: address, value: cryptoAtoms.toNumber() };
      return buildCryptx(account, cryptoCode).send(params);
    })
    .then((result) => {
      let fee = parseFloat(
        Number(result.walletFee) + Number(result.blockchainFee)
      );
      let txid = result.txid;

      return { txid: txid, fee: BN(fee).round() };
    })
    .catch((err) => {
      if (err && err.errorMessage === "Insufficient Funds") {
        throw new E.InsufficientFundsError();
      }
      throw err;
    });
}

function confirmedBalance(account, cryptoCode, address) {
  return checkCryptoCode(cryptoCode).then(() =>
    buildCryptx(account, cryptoCode)
      .addressBalance({ address, minConf: 1 })
      .then((balance) => BN(balance))
  );
}

function pendingBalance(account, cryptoCode, address) {
  return checkCryptoCode(cryptoCode).then(() =>
    buildCryptx(account, cryptoCode)
      .addressBalance({ address, minConf: 0 })
      .then((balance) => BN(balance))
  );
}

function balance(account, cryptoCode) {
  return checkCryptoCode(cryptoCode).then(() =>
    buildCryptx(account, cryptoCode)
      .getBalance()
      .then((balance) => BN(balance.spendableBalance))
  );
}

function newAddress(account, info) {
  return checkCryptoCode(info.cryptoCode)
    .then(() =>
      buildCryptx(account, info.cryptoCode).createAddress({
        name: info.name || "Deposit Address",
        addressFormat: addressFormats[info.cryptoCode],
      })
    )
    .then((result) => result.address);
}

function getStatus(account, toAddress, requested, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => confirmedBalance(account, cryptoCode, toAddress))
    .then((confirmed) => {
      if (confirmed.gte(requested))
        return { receivedCryptoAtoms: confirmed, status: "confirmed" };

      return pendingBalance(acoount, cryptoCode, toAddress).then((pending) => {
        if (pending.gte(requested))
          return { receivedCryptoAtoms: pending, status: "authorized" };
        if (pending.gt(0))
          return { receivedCryptoAtoms: pending, status: "insufficientFunds" };
        return { receivedCryptoAtoms: pending, status: "notSeen" };
      });
    });
}

function newFunding(account, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      const promises = [
        buildCryptx(account, cryptoCode).getBalance(),
        newAddress(account, { cryptoCode, name: "Funding Address" }),
      ];

      return Promise.all(promises);
    })
    .then(([balance, fundingAddress]) => ({
      fundingPendingBalance: BN(balance.balance),
      fundingConfirmedBalance: BN(balance.confirmedBalance),
      fundingAddress,
    }));
}

function cryptoNetwork(account, cryptoCode) {
  return checkCryptoCode(cryptoCode).then(() =>
    account.environment === "production" ? "production" : "test"
  );
}

module.exports = {
  NAME,
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  cryptoNetwork,
};
