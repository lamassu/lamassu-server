const { gql } = require('apollo-server-express')
module.exports = gql`
type Coin {
  cryptoCode: String!
  display: String!
  minimumTx: String!
  cashInFee: String!
  cashInCommission: String!
  cashOutCommission: String!
  cryptoNetwork: String!
  cryptoUnits: String!
  batchable: Boolean!
}

type LocaleInfo {
  country: String!
  fiatCode: String!
  languages: [String!]!
}

type OperatorInfo {
  name: String!
  phone: String!
  email: String!
  website: String!
  companyNumber: String!
}

type MachineInfo {
  deviceId: String!
  deviceName: String
}

type ReceiptInfo {
  sms: Boolean!
  operatorWebsite: Boolean!
  operatorEmail: Boolean!
  operatorPhone: Boolean!
  companyNumber: Boolean!
  machineLocation: Boolean!
  customerNameOrPhoneNumber: Boolean!
  exchangeRate: Boolean!
  addressQRCode: Boolean!
}

type SpeedtestFile {
  url: String!
  size: Int!
}

# True if automatic, False otherwise
type TriggersAutomation {
  sanctions: Boolean!
  idCardPhoto: Boolean!
  idCardData: Boolean!
  facephoto: Boolean!
  usSsn: Boolean!
}

type Trigger {
  id: String!
  customInfoRequestId: String!
  direction: String!
  requirement: String!
  triggerType: String!

  suspensionDays: Int
  threshold: Int
  thresholdDays: Int
}

type TermsDetails {
  delay: Boolean!
  title: String!
  accept: String!
  cancel: String!
}

type Terms {
  hash: String!
  text: String
  details: TermsDetails
}

type StaticConfig {
  configVersion: Int!

  areThereAvailablePromoCodes: Boolean!
  coins: [Coin!]!
  enablePaperWalletOnly: Boolean!
  hasLightning: Boolean!
  serverVersion: String!
  timezone: Int!
  twoWayMode: Boolean!

  localeInfo: LocaleInfo!
  operatorInfo: OperatorInfo
  machineInfo: MachineInfo!
  receiptInfo: ReceiptInfo

  speedtestFiles: [SpeedtestFile!]!
  urlsToPing: [String!]!

  triggersAutomation: TriggersAutomation!
  triggers: [Trigger!]!
}

type DynamicCoinValues {
  # NOTE: Doesn't seem to be used anywhere outside of lib/plugins.js.
  # However, it can be used to generate the cache key, if we ever move to an
  # actual caching mechanism.
  #timestamp: String!

  cryptoCode: String!
  balance: String!

  # Raw rates
  ask: String!
  bid: String!

  # Rates with commissions applied
  cashIn: String!
  cashOut: String!

  zeroConfLimit: Int!
}

type PhysicalCassette {
  denomination: Int!
  count: Int!
}

type Cassettes {
  physical: [PhysicalCassette!]!
  virtual: [Int!]!
}

type DynamicConfig {
  cassettes: Cassettes
  coins: [DynamicCoinValues!]!
  reboot: Boolean!
  shutdown: Boolean!
  restartServices: Boolean!
}

type Configs {
  static: StaticConfig
  dynamic: DynamicConfig!
}

type Query {
  configs(currentConfigVersion: Int): Configs!
  terms(currentHash: String, currentConfigVersion: Int): Terms
}
`
