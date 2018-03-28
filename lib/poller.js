const plugins = require('./plugins')
const notifier = require('./notifier')
const T = require('./time')
const logger = require('./logger')
const cashOutTx = require('./cash-out/cash-out-tx')
const cashInTx = require('./cash-in/cash-in-tx')

const INCOMING_TX_INTERVAL = 30 * T.seconds
const LIVE_INCOMING_TX_INTERVAL = 5 * T.seconds
const UNNOTIFIED_INTERVAL = 10 * T.seconds
const SWEEP_HD_INTERVAL = T.minute
const TRADE_INTERVAL = 60 * T.seconds
const PONG_INTERVAL = 10 * T.seconds
const PONG_CLEAR_INTERVAL = 1 * T.day

const CHECK_NOTIFICATION_INTERVAL = 20 * T.seconds

const PENDING_INTERVAL = 10 * T.seconds

let _pi, _settings

function reload (__settings) {
  _settings = __settings
  _pi = plugins(_settings)
  logger.debug('settings reloaded in poller')
}

function pi () { return _pi }
function settings () { return _settings }

function start (__settings) {
  reload(__settings)

  pi().executeTrades()
  pi().pong()
  pi().pongClear()
  cashOutTx.monitorLiveIncoming(settings())
  cashOutTx.monitorStaleIncoming(settings())
  cashOutTx.monitorUnnotified(settings())
  pi().sweepHd()
  notifier.checkNotification(pi())

  setInterval(() => pi().executeTrades(), TRADE_INTERVAL)
  setInterval(() => cashOutTx.monitorLiveIncoming(settings()), LIVE_INCOMING_TX_INTERVAL)
  setInterval(() => cashOutTx.monitorStaleIncoming(settings()), INCOMING_TX_INTERVAL)
  setInterval(() => cashOutTx.monitorUnnotified(settings()), UNNOTIFIED_INTERVAL)
  setInterval(() => cashInTx.monitorPending(settings()), PENDING_INTERVAL)
  setInterval(() => pi().sweepHd(), SWEEP_HD_INTERVAL)
  setInterval(() => pi().pong(), PONG_INTERVAL)
  setInterval(() => pi().pongClear(), PONG_CLEAR_INTERVAL)
  setInterval(() => notifier.checkNotification(pi()), CHECK_NOTIFICATION_INTERVAL)
}

module.exports = {start, reload}
