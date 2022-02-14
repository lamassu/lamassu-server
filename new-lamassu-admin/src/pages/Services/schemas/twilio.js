import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import secretTest from './helper'

export default {
  code: 'twilio',
  name: 'Twilio',
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
  getValidationSchema: account => {
    return Yup.object().shape({
      accountSid: Yup.string('The account SID must be a string')
        .max(100, 'The account SID is too long')
        .required('The account SID is required'),
      authToken: Yup.string('The auth token must be a string')
        .max(100, 'The auth token is too long')
        .test(secretTest(account?.authToken)),
      fromNumber: Yup.string('The from number must be a string')
        .max(100, 'The from number is too long')
        .required('The from number is required'),
      toNumber: Yup.string('The to number must be a string')
        .max(100, 'The to number is too long')
        .required('The to number is required')
    })
  }
}
