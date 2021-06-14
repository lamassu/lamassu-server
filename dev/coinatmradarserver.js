const express = require('express')
const app = express()

app.use(express.raw({ type: '*/*' }))

app.post('/api/lamassu', (req, res) => {
  console.log(req.headers)
  console.log(req.body.toString())
  res.send('Hello World!')
})

app.listen(3200, () => console.log('Example app listening on port 3200!'))

//     "url": "https://coinatmradar.info/api/lamassu/"
