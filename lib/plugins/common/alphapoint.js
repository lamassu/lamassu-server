const APEX = require('alphapoint').APEX;

let alphapointApi = null
let user = null;
let products = null;
let instruments = null;

const initApiConnection = gateway => {
  return new Promise((resolve, reject) => {
    alphapointApi = new APEX(gateway, {
      onopen: resolve,
      onclose: reject,
    });
    alphapointApi.standardCallback = () => {};
  });
};

const fetchProducts = async user => {
  products = await alphapointApi.GetProducts({ OMSId: user.OMSId });
};

const getProductId = async (user, symbol) => {
  if (!products) {
    await fetchProducts(user)
  }

  const result = products.find(x => x.Product === symbol);

  return result.ProductId;
};

const fetchInstruments = async OMSId => {
  instruments = await alphapointApi.GetInstruments({ OMSId });
};

const getInstrumentId = async (cryptoCode, fiatCode, OMSId = 1) => {
  if (!instruments) {
    await fetchInstruments(OMSId);
  }

  const result = instruments.find(x => x.Symbol === `${cryptoCode}${fiatCode}`);

  return result.InstrumentId;
};

const auth = async account => {
  if (!alphapointApi) {
    await initApiConnection(account.gateway);
  }
  if (!user) {
    const response = await alphapointApi.AuthenticateUser({
      APIKey: account.APIKey,
      Signature: account.Signature,
      UserId: account.UserId,
      Nonce: account.Nonce,
    });

    user = {
      accountId: response.User.AccountId,
      userId: response.User.UserId,
      OMSId: response.User.OMSId,
    };
  }

  return user;
};

const getLevel1Data = instrumentId => {
  return new Promise(resolve => {
    const level1Ins = {
      instrumentId,
      callback: updates => {
        alphapointApi.unsubscribeLevel1(instrumentId);
        resolve(JSON.parse(updates.o));
      },
    };

    alphapointApi.level1.next(level1Ins);
  });
};

const orderSide = {
  buy: '0',
  sell: '1',
};

const getAvailableBalance = (balance, hold) => {
  return balance ? balance - hold : 0;
};

const checkBalance = async (user, fiatCode, cryptoCode, side, amount) => {
  const instrumentId = await getInstrumentId(cryptoCode, fiatCode, user.OMSId);

  const rates = await getLevel1Data(instrumentId);

  const { BestBid } = rates;

  const positions = await alphapointApi.GetAccountPositions({
    OMSId: user.OMSId,
    AccountId: user.accountId,
  });

  const fiatBalance = positions.find(position => position.ProductSymbol === fiatCode);
  const cryptoBalance = positions.find(position => position.ProductSymbol === cryptoCode);

  const fiatAvailableBalance = getAvailableBalance(fiatBalance.Amount, fiatBalance.Hold);
  const cryptoAvailableBalance = getAvailableBalance(cryptoBalance.Amount, cryptoBalance.Hold);

  if (side === orderSide.sell) {
    return amount <= cryptoAvailableBalance;
  } else {
    return amount * BestBid <= fiatAvailableBalance;
  }
};

module.exports = {
  initApiConnection,
  alphapointApi,
  auth,
  getInstrumentId,
  getProductId,
  getLevel1Data,
  checkBalance,
};
