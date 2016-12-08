const plugins = require('./plugins')
const T = require('./time')

const INCOMING_TX_INTERVAL = 30 * T.seconds
const LIVE_INCOMING_TX_INTERVAL = 5 * T.seconds
const UNNOTIFIED_INTERVAL = 10 * T.seconds
const SWEEP_LIVE_HD_INTERVAL = T.minute
const SWEEP_OLD_HD_INTERVAL = 2 * T.minutes
const TRADE_INTERVAL = 10 * T.seconds
const PONG_INTERVAL = 10 * T.seconds
const PONG_CLEAR_INTERVAL = 1 * T.day

let pi

function reload (settings) {
  pi = plugins(settings)
}

function start (settings) {
  reload(settings)

  pi.executeTrades()
  pi.pong()
  pi.pongClear()
  pi.monitorLiveIncoming()
  pi.monitorIncoming()
  pi.monitorUnnotified()
  pi.sweepLiveHD()
  pi.sweepOldHD()

  setInterval(() => pi.executeTrades(), TRADE_INTERVAL)
  setInterval(() => pi.monitorLiveIncoming(), LIVE_INCOMING_TX_INTERVAL)
  setInterval(() => pi.monitorIncoming(), INCOMING_TX_INTERVAL)
  setInterval(() => pi.monitorUnnotified(), UNNOTIFIED_INTERVAL)
  setInterval(() => pi.sweepLiveHD(), SWEEP_LIVE_HD_INTERVAL)
  setInterval(() => pi.sweepOldHD(), SWEEP_OLD_HD_INTERVAL)
  setInterval(() => pi.pong(), PONG_INTERVAL)
  setInterval(() => pi.pongClear(), PONG_CLEAR_INTERVAL)
}

module.exports = {start, reload}
