import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

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
  validationSchema: Yup.object().shape({
    accountSid: Yup.string()
      .max(100, 'Too long')
      .required('Required'),
    authToken: Yup.string()
      .max(100, 'Too long')
      .required('Required'),
    fromNumber: Yup.string()
      .max(100, 'Too long')
      .required('Required'),
    toNumber: Yup.string()
      .max(100, 'Too long')
      .required('Required')
  })
}
