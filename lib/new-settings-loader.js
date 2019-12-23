const _ = require('lodash/fp')
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')

const adapter = new FileAsync('db.json')
let db = null

low(adapter).then(it => {
  db = it
})

function saveConfig (config) {
  const currentState = db.getState()
  const newState = _.merge(currentState, config)
  console.log(config)
  console.log('save')
  console.log(newState)

  db.setState(newState)
  return db.write()
    .then(() => newState)
}

function getConfig () {
  return db.getState()
}

module.exports = { getConfig, saveConfig }
