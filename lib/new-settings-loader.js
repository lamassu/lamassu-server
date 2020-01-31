const _ = require('lodash/fp')
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')

const adapter = new FileAsync('db.json')
let db = null

low(adapter).then(it => {
  db = it
})

function saveConfig(config) {
  const currentState = db.getState()
  const newState = _.mergeWith((objValue, srcValue) => {
    if (_.isArray(objValue)) {
      return srcValue
    }
  }, currentState, config)

  db.setState(newState)
  return db.write()
    .then(() => newState)
}

function getConfig() {
  return db.getState()
}

module.exports = { getConfig, saveConfig }
