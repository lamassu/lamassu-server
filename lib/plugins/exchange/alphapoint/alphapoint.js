const { auth, alphapointApi, getInstrumentId, checkBalance } = require('../../common/alphapoint');

const NAME = 'Alphapoint';

const orderSide = {
  buy: '0',
  sell: '1',
};

const marketOrderType = '1';

const pegPriceType = {
  bid: '2',
  ask: '3',
};

const getPegPriceTypeBySide = side => {
  return side === orderSide.buy ? pegPriceType.ask : pegPriceType.bid;
};

const buy = (account, amount, fiatCode, cryptoCode) => {
  return trade(account, orderSide.buy, amount, fiatCode, cryptoCode);
};

const sell = (account, amount, fiatCode, cryptoCode) => {
  return trade(account, orderSide.sell, amount, fiatCode, cryptoCode);
};

const trade = async (account, side, amount, fiatCode, cryptoCode) => {
  const user = await auth(account);

  const instrumentId = await getInstrumentId(cryptoCode, fiatCode, user.OMSId);

  const isBalanceAvailable = await checkBalance(user, fiatCode, cryptoCode, side, amount);

  if (isBalanceAvailable) {
    const orderInfo = {
      InstrumentId: instrumentId,
      OMSId: user.OMSId,
      AccountId: user.accountId,
      TimeInForce: 1,
      ClientOrderId: 0,
      OrderIdOCO: 0,
      TimeInOrder: 0,
      UseDisplayQuantity: false,
      Side: side,
      Quantity: amount,
      OrderType: marketOrderType,
      PegPriceType: getPegPriceTypeBySide(side),
    };

    const result = await alphapointApi.SendOrder(orderInfo);

    return result;
  } else {
    throw new Error('Balance unavailable');
  }
};

module.exports = { NAME, buy, sell };
