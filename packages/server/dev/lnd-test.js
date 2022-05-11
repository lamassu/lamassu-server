const lnd = require('lnd-async')
const path = require('path')

async function getInfo () {
  let client = await lnd.connect({
    certPath: path.resolve(__dirname, '../scratch/lnd/tls.cert'),
    macaroonPath: path.resolve(__dirname, '../scratch/lnd/admin.macaroon')
  })
  return client.getInfo({})
}

getInfo().then(console.log)
