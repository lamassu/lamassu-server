import test from 'ava'
import rewire from 'rewire'
import BN from '../../lib/bn'

function rewireGetCurrencyRates (commonMock) {
  const itbit = rewire('../../lib/plugins/ticker/itbit/itbit')

  itbit.__set__('common', commonMock)

  const getCurrencyRates = itbit.__get__('getCurrencyRates')

  return getCurrencyRates
}

test('get currency rates of BTC USD', async t => {
  function mockRequest() {
    return Promise.resolve({
      pair: 'XBTUSD',
      bid: '622',
      bidAmt: '0.0006',
      ask: '641.29',
      askAmt: '0.5',
      lastPrice: '618.00000000',
      lastAmt: '0.00040000',
      volume24h: '0.00040000',
      volumeToday: '0.00040000',
      high24h: '618.00000000',
      low24h: '618.00000000',
      highToday: '618.00000000',
      lowToday: '618.00000000',
      openToday: '618.00000000',
      vwapToday: '618.00000000',
      vwap24h: '618.00000000',
      serverTimeUTC: '2014-06-24T20:42:35.6160000Z'
    })
  }
  
  const common = rewire('../../lib/plugins/common/itbit')
  
  common.request = mockRequest

  const getCurrencyRates = rewireGetCurrencyRates(common)

  let result = await getCurrencyRates('USD', 'BTC')

  t.true(result.rates.bid.eq('622'))
  t.true(result.rates.ask.eq('641.29'))
})
