// Adapted from https://medium.com/@soffritti.pierfrancesco/create-a-simple-event-bus-in-javascript-8aa0370b3969

const uuid = require('uuid')
const _ = require('lodash/fp')

const subscriptions = {}

function subscribe (eventType, callback) {
  const id = uuid.v1()

  if (!subscriptions[eventType]) subscriptions[eventType] = {}

  subscriptions[eventType][id] = callback

  return {
    unsubscribe: () => {
      delete subscriptions[eventType][id]
      if (_.keys(subscriptions[eventType]).length === 0) delete subscriptions[eventType]
    }
  }
}

function publish (eventType, arg) {
  if (!subscriptions[eventType]) return

  _.keys(subscriptions[eventType]).forEach(key => subscriptions[eventType][key](arg))
}

module.exports = { subscribe, publish }
