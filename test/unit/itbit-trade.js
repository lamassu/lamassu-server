import test from 'ava'
import rewire from 'rewire'
import BN from '../../lib/bn'

function rewireTrade (commonMock, calculatePrice = () => Promise.resolve(15)) {
  const itbit = rewire('../../lib/plugins/exchange/itbit/itbit')

  itbit.__set__('common', commonMock)
  itbit.__set__('calculatePrice', calculatePrice)

  const trade = itbit.__get__('trade')

  return trade
}

test('should handle itbit error response', async t => {
  t.plan(1)

  const commonMock = {
    mock: true,
    authRequest () {
      return Promise.reject(new Error('The wallet provided does not have the funds required to place the order.'))
    },
    buildMarket () {
      return 'XBTUSD'
    }
  }

  const trade = rewireTrade(commonMock)

  trade('buy', { walletId: 'id' }, BN('93410'), 'USD', 'BTC')
    .catch(err => {
      t.regex(err.message, /wallet provided/g)
    })
})
