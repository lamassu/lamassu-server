import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import secretTest from './helper'

export default {
  code: 'twilio',
  name: 'Twilio',
  hasSecret: true,
  title: 'Twilio (SMS)',
  elements: [
    {
      code: 'accountSid',
      display: 'Account SID',
      component: TextInputFormik
    },
    {
      code: 'authToken',
      display: 'Auth Token',
      component: SecretInputFormik
    },
    {
      code: 'fromNumber',
      display: 'Twilio Number (international format)',
      component: TextInputFormik,
      face: true
    },
    {
      code: 'toNumber',
      display: 'Notifications Number (international format)',
      component: TextInputFormik,
      face: true
    }
  ],
  validationSchema: Yup.object().shape({
    accountSid: Yup.string()
      .max(100, 'Too long')
      .required(),
    authToken: Yup.string()
      .max(100, 'Too long')
      .required(),
    fromNumber: Yup.string()
      .max(100, 'Too long')
      .required(),
    toNumber: Yup.string()
      .max(100, 'Too long')
      .required()
  }),
  getValidationSchema: account => {
    const schema = {
      accountSid: Yup.string()
        .max(100, 'Too long')
        .required(),
      authToken: Yup.string()
        .max(100, 'Too long')
        .test(secretTest(account?.authToken)),
      fromNumber: Yup.string()
        .max(100, 'Too long')
        .required(),
      toNumber: Yup.string()
        .max(100, 'Too long')
        .required()
    }
    return Yup.object().shape(schema)
  }
}
