import test from 'ava'
import rewire from 'rewire'

function rewireCalculatePrice (commonMock) {
  const itbit = rewire('../../lib/plugins/exchange/itbit/itbit')

  itbit.__set__('common', commonMock)

  const calculatePrice = itbit.__get__('calculatePrice')

  return calculatePrice
}

test('calculate minimum available price for buy', async t => {
  const commonMock = {
    request () {
      return Promise.resolve({
        asks: [
          [2, 10],
          [4, 15],
          [4.5, 17]
        ],
        bids: []
      })
    }
  }

  const calculatePrice = rewireCalculatePrice(commonMock)

  let price = await calculatePrice('buy', 'XBTUSD', 20)

  t.is(price, 4)
})

test('calculate minimum available price for sell', async t => {
  const commonMock = {
    request () {
      return Promise.resolve({
        bids: [
          [2, 10],
          [3, 15],
          [4.5, 17]
        ],
        asks: []
      })
    }
  }

  const calculatePrice = rewireCalculatePrice(commonMock)

  let price = await calculatePrice('sell', 'XBTUSD', 20)

  t.is(price, 3)
})

test('throw error on insufficient trade depth', async t => {
  t.plan(1)

  const commonMock = {
    request () {
      return Promise.resolve({
        asks: [
          [2, 10],
          [4, 15],
          [4.5, 17]
        ],
        bids: []
      })
    }
  }

  const calculatePrice = rewireCalculatePrice(commonMock)

  calculatePrice('buy', 'XBTUSD', 100)
    .catch(err => {
      t.is(err.message, 'Insufficient market depth')
    })
})
