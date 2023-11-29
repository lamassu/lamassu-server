const Yup = require('yup')
const R = require('ramda')

const transformNumber = value => (isValidNumber(value) ? value : null)
const highestBill = bills => R.isEmpty(bills) ? CURRENCY_MAX : Math.max(...bills)
const isDefined = it => it && it.length

const PREFILL = {
    smsCode: {
      validator: Yup.string()
        .required('The message content is required!')
        .trim()
        .test({
          name: 'has-code',
          message: 'The confirmation code is missing from the message!',
          exclusive: false,
          test: value => value?.match(/#code/g || [])?.length > 0
        })
        .test({
          name: 'has-single-code',
          message: 'There should be a single confirmation code!',
          exclusive: false,
          test: value => value?.match(/#code/g || [])?.length === 1
        })
    },
    cashOutDispenseReady: {
      validator: Yup.string()
        .required('The message content is required!')
        .trim()
    },
    smsReceipt: {
      validator: Yup.string().trim()
    }
}

const getAlreadyUsed = (id, machine, values) => {
  const getCrypto = R.prop('cryptoCurrencies')
  const getMachineId = R.prop('machine')

  const filteredOverrides = R.filter(R.propEq('machine', machine))(values)
  const originalValue = R.find(R.propEq('id', id))(values)

  const originalCryptos = getCrypto(originalValue)
  const originalMachineId = getMachineId(originalValue)

  const alreadyUsed = R.compose(
    R.uniq,
    R.flatten,
    R.map(getCrypto)
  )(filteredOverrides)

  if (machine !== originalMachineId) return alreadyUsed ?? []

  return R.difference(alreadyUsed, originalCryptos)
}

const buildTestValidation = (id, passphrase) => {
  return Yup.string()
    .max(100, 'Too long')
    .when(id, {
      is: isDefined,
      then: Yup.string().test(secretTest(passphrase))
    })
}

const secretTest = (secret, message) => ({
  name: 'secret-test',
  message: message ? `The ${message} is invalid` : 'Invalid field',
  test(val) {
    if (R.isNil(secret) && R.isNil(val)) {
      return this.createError()
    }
    return true
  }
})

const leadingZerosTest = (value, context) => {
  if (
    R.startsWith('0', context.originalValue) &&
    R.length(context.originalValue) > 1
  ) {
    return context.createError()
  }
  return true
}

const triggerType = Yup.string().required()
const threshold = Yup.object().shape({
  threshold: Yup.number()
    .nullable()
    .transform(transformNumber)
    .label('Invalid threshold'),
  thresholdDays: Yup.number()
    .transform(transformNumber)
    .nullable()
    .label('Invalid threshold days')
})

const requirement = Yup.object().shape({
  requirement: Yup.string().required(),
  suspensionDays: Yup.number()
    .transform(transformNumber)
    .nullable()
})

module.exports = {
  transformNumber,
  PREFILL,
  getAlreadyUsed,
  highestBill,
  buildTestValidation,
  secretTest,
  leadingZerosTest,
  isDefined,
  triggerType,
  threshold,
  requirement
}
