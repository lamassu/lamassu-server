const axios = require("axios");

function createInstance(config) {
  const client = axios.create({
    baseURL: config.endPoint,
    headers: { Authorization: `Bearer ${config.token}` },
  });

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      const err = (error && error.response && error.response.data) || {
        response: {},
      };
      return Promise.reject(err);
    }
  );

  return client;
}

/**
 *
 *
 * @param {{ token: string, env: string }} cnfg
 */
function CryptxPlugin(cnfg) {
  var config = {
    token: cnfg.token,
    endPoint:
      cnfg.env === "production"
        ? "https://api.cryptx.com/api/v2/"
        : "http://62.168.190.83:8880/api/v2/",
    env: cnfg.env === "production" ? "production" : "test",
  };
  var instance = createInstance(config);

  this.getWalletBalance = function (params) {
    return instance
      .get(`${params.coin}/wallet/${params.walletId}/balance`)
      .then(({ data }) => data);
  };

  this.sendTransaction = function (params) {
    const data = {
      address: params.address,
      value: params.value,
      blockSize: 2,
      subtractFeeFromOutputs: false,
    };

    return instance
      .post(`${params.coin}/wallet/${params.walletId}/transaction`, data)
      .then(({ data }) => data);
  };

  this.createAddress = function (params) {
    const data = {
      name: params.name || "DEPOSIT ADDRESS",
      addressFormat: params.addressFormat,
    };

    return instance
      .post(`${params.coin}/wallet/${params.walletId}/address`, data)
      .then(({ data }) => data);
  };

  this.getBalanceOnAddress = function (params) {
    const p = { minConf: params.minConf };

    return instance
      .get(
        `${params.coin}/wallet/${params.walletId}/balance/${params.address}`,
        {
          params: p,
        }
      )
      .then(({ data }) => data);
  };
}

module.exports = CryptxPlugin;
