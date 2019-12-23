const { getInstrumentId, getLevel1Data, initApiConnection } = require('../../common/alphapoint');
const BN = require('../../../bn')

const NAME = 'Alphapoint';

// TODO: change to prod url
const gateway = 'wss://apidemo.approd.net/WSGateway/';

const ticker = async (cryptoCode, fiatCode) => {
  await initApiConnection(gateway);
  const instrumentId = await getInstrumentId(cryptoCode, fiatCode);

  if (instrumentId) {
    const rates = await getLevel1Data(instrumentId);

    const { BestOffer: ask, BestBid: bid } = rates;
    return {
      ask: BN(ask.toSting()),
      bid: BN(bid.toSting()),
    };
  } else {
    throw new Error(`Unsupported currency pair: ${cryptoCode}${fiatCode}`);
  }
};

module.exports = { NAME, ticker };
