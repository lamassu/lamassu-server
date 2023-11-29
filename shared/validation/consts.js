const PASSWORD_MIN_LENGTH = 8
const CURRENCY_MAX = 9999999
const percentMax = 100
const percentMin = 0
const notesMin = 0

const CASSETTE_1_KEY = 'fillingPercentageCassette1'
const CASSETTE_2_KEY = 'fillingPercentageCassette2'
const CASSETTE_3_KEY = 'fillingPercentageCassette3'
const CASSETTE_4_KEY = 'fillingPercentageCassette4'
const MACHINE_KEY = 'machine'

const CASSETTE_LIST = [
  CASSETTE_1_KEY,
  CASSETTE_2_KEY,
  CASSETTE_3_KEY,
  CASSETTE_4_KEY
]

const ALL_MACHINES = {
  name: 'All Machines',
  deviceId: 'ALL_MACHINES'
}

const ALL_COINS = {
  display: 'All Coins',
  code: 'ALL_COINS'
}

module.exports = {
  CURRENCY_MAX,
  PASSWORD_MIN_LENGTH,
  percentMax,
  percentMin,
  notesMin,
  ALL_COINS,
  ALL_MACHINES,
  CASSETTE_LIST,
  CASSETTE_1_KEY,
  CASSETTE_2_KEY,
  CASSETTE_3_KEY,
  CASSETTE_4_KEY,
  MACHINE_KEY
}
