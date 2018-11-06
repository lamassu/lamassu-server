import test from 'ava'

import { filterAccounts } from '../../lib/admin/config'

const ALL_CRYPTOS = ['BTC', 'ETH', 'LTC', 'DASH', 'ZEC', 'BCH']
const data = {
  accounts: [
    {code: 'mock-ticker', display: 'Mock ticker', class: 'ticker', cryptos: ALL_CRYPTOS},
    {code: 'bitcoind', display: 'bitcoind', class: 'wallet', cryptos: ['BTC']},
    {code: 'quadrigacx', display: 'QuadrigaCX', class: 'exchange', cryptos: ['BTC', 'ETH', 'LTC', 'BCH']},
    {code: 'mock-wallet', display: 'Mock (Caution!)', class: 'wallet', cryptos: ALL_CRYPTOS}
  ]
}

test('Do not filter accounts in dev mode', t => {
  const devMode = true
  const filteredData = filterAccounts(data, devMode)
  t.is(filteredData.accounts.length, 4)
})

test('Filter accounts in production', t => {
  const filteredData = filterAccounts(data)
  t.is(filteredData.accounts.length, 2)
})
