import _binance from './binance'
import _binanceus from './binanceus'
import _bitgo from './bitgo'
import _bitstamp from './bitstamp'
import blockcypher from './blockcypher'
import _cex from './cex'
import ciphertrace from './ciphertrace'
import _ftx from './ftx'
import _infura from './infura'
import _itbit from './itbit'
import _kraken from './kraken'
import mailgun from './mailgun'
import twilio from './twilio'

const schemas = ({ markets = {}, cryptos = {} }) => {
  const binance = _binance(markets?.binance)
  const binanceus = _binanceus(markets?.binanceus)
  const bitstamp = _bitstamp(markets?.bitstamp)
  const cex = _cex(markets?.cex)
  const ftx = _ftx(markets?.ftx)
  const itbit = _itbit(markets?.itbit)
  const kraken = _kraken(markets?.kraken)

  const bitgo = _bitgo(cryptos?.bitgo)
  const infura = _infura(cryptos?.infura)

  return {
    [bitgo.code]: bitgo,
    [bitstamp.code]: bitstamp,
    [blockcypher.code]: blockcypher,
    [infura.code]: infura,
    [itbit.code]: itbit,
    [kraken.code]: kraken,
    [mailgun.code]: mailgun,
    [twilio.code]: twilio,
    [binanceus.code]: binanceus,
    [cex.code]: cex,
    [ftx.code]: ftx,
    [ciphertrace.code]: ciphertrace,
    [binance.code]: binance
  }
}

export default schemas
