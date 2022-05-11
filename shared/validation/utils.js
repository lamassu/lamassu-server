const Yup = require('yup')

const transformNumber = value => (isValidNumber(value) ? value : null)

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

module.exports = {
  transformNumber,
  PREFILL
}
