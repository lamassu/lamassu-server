const Yup = require('yup')
const utils = require('./utils.js')
const { CURRENCY_MAX } = require('./consts.js')

module.exports = {
  BOOLEAN: Yup.boolean().required(),
  WALLET: {
    DEFAULT: Yup.object().shape({
      ticker: Yup.string().required(),
      wallet: Yup.string().required(),
      exchange: Yup.string().required(),
      zeroConf: Yup.string(),
      zeroConfLimit: Yup.number()
        .integer()
        .min(0)
        .max(CURRENCY_MAX)
        .transform(utils.transformNumber)
    }),
    OVERRIDE: Yup.object().shape({
      cryptoUnits: Yup.string().required(),
      feeMultiplier: Yup.string()
        .default(() => '1')
        .required(),
      cryptoCurrency: Yup.string().required(),
      allowTransactionBatching: Yup.boolean()
        .default(() => false)
        .required()
    }),
    ADVANCED: Yup.object().shape({
      cryptoUnits: Yup.string().required(),
      feeMultiplier: Yup.string().required(),
      allowTransactionBatching: Yup.boolean()
    })
  },
  CONTACT_INFO: Yup.object().shape({
    active: Yup.boolean(),
    name: Yup.string(),
    phone: Yup.string(),
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('An email is required'),
    website: Yup.string(),
    companyNumber: Yup.string()
  }),
  TERMS_CONDITIONS: Yup.object().shape({
    title: Yup.string()
      .required()
      .max(50, 'Too long'),
    text: Yup.string().required(),
    acceptButtonText: Yup.string()
      .required()
      .max(50, 'Too long'),
    cancelButtonText: Yup.string()
      .required()
      .max(50, 'Too long')
  }),
  SMS_NOTICES: {
    DEFAULT: event =>
      Yup.object().shape({
        event: Yup.string().required('An event is required!'),
        message:
          utils.PREFILL[event]?.validator ??
          Yup.string()
            .required('The message content is required!')
            .trim()
      })
  }
}
