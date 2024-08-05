const { gql } = require('apollo-server-express')
module.exports = gql`
type Coin {
  cryptoCode: String!
  cryptoCodeDisplay: String!
  display: String!
  minimumTx: String!
  cashInFee: String!
  cashInCommission: String!
  cashOutCommission: String!
  cryptoNetwork: String!
  cryptoUnits: String!
  batchable: Boolean!
  isCashInOnly: Boolean!
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
  numberOfCassettes: Int
  numberOfRecyclers: Int
}

type ReceiptInfo {
  paper: Boolean!
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

enum TriggerAutomationType {
  Automatic
  Manual
}

type CustomTriggersAutomation {
  id: ID!
  type: TriggerAutomationType!
}

type TriggersAutomation {
  sanctions: TriggerAutomationType!
  idCardPhoto: TriggerAutomationType!
  idCardData: TriggerAutomationType!
  facephoto: TriggerAutomationType!
  usSsn: TriggerAutomationType!
  custom: [CustomTriggersAutomation]!
}

type CustomScreen {
  text: String!
  title: String!
}

type CustomInput { 
  type: String!
  constraintType: String!
  label1: String
  label2: String
  choiceList: [String]
}

type CustomRequest {
  name: String!
  input: CustomInput!
  screen1: CustomScreen!
  screen2: CustomScreen!
} 

type CustomInfoRequest {
  id: String!
  enabled: Boolean!
  customRequest: CustomRequest!
}

type Trigger {
  id: String!
  direction: String!
  requirement: String!
  triggerType: String!

  suspensionDays: Float
  threshold: Int
  thresholdDays: Int
  customInfoRequestId: String
  customInfoRequest: CustomInfoRequest
  externalService: String
}

type TermsDetails {
  tcPhoto: Boolean!
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

enum CustomerAuthentication {
  EMAIL
  SMS
}

type StaticConfig {
  configVersion: Int!

  coins: [Coin!]!
  enablePaperWalletOnly: Boolean!
  hasLightning: Boolean!
  serverVersion: String!
  timezone: Int!
  twoWayMode: Boolean!
  customerAuthentication: CustomerAuthentication!

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
  name: String!
  denomination: Int!
  count: Int!
}

type PhysicalRecycler {
  name: String!
  number: Int!
  denomination: Int!
  count: Int!
}

type Cassettes {
  physical: [PhysicalCassette!]!
  virtual: [Int!]!
}

type Recyclers {
  physical: [PhysicalRecycler!]!
  virtual: [Int!]!
}

type DynamicConfig {
  areThereAvailablePromoCodes: Boolean!
  cassettes: Cassettes
  recyclers: Recyclers
  coins: [DynamicCoinValues!]!
  reboot: Boolean!
  shutdown: Boolean!
  restartServices: Boolean!
  emptyUnit: Boolean!
  refillUnit: Boolean!
  diagnostics: Boolean!
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
