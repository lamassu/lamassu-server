//axios is an http library provided by npm
const axios = require('axios')

//BN is an npm library for BigNumber objects
const BN = require('../../../bn')

function ticker (account, fiatCode, cryptoCode) {

  return axios.get('https://www.coinome.com/api/v1/ticker.json')
  .then(r => {

//put the json data into a constant
const dataLoad  = r.data
const currencyPair = cryptoCode + '-' + fiatCode
console.log('we made it to dataLoad')


//create a variable to hold the price data
var holder

holder = dataLoad[currencyPair].last

return {
      rates: {
        ask: BN(holder),
        bid: BN(holder)
      }}
  })
}

/*Don't forget to change ../admin/config.js if you are changing tickers */


module.exports = {
  ticker,
name: 'Coinome'
}
