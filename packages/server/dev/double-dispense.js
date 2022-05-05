const got = require('got')

const tx = {
  sessionId: 'a9fdfedc-1d45-11e6-be13-2f68ff6306b9',
  toAddress: '1DrK44np3gMKuvcGeFVv9Jk67zodP52eMu',
  fiat: 10
}

const headers = {
  'content-type': 'application/json',
  'session-id': '36f17fbe-1d44-11e6-a1a9-bbe8a5a41617'
}

const body = JSON.stringify({tx: tx})
got('http://localhost:3000/dispense', {body: body, json: true, headers: headers})
  .then(res => {
    console.log(res.body)
  })
  .catch(console.log)
