import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { secretTest } from './helper'

export default {
  code: 'inforu',
  name: 'InforU',
  title: 'InforU (SMS)',
  elements: [
    {
      code: 'username',
      display: 'InforU username',
      component: TextInputFormik,
      face: true
    },
    {
      code: 'apiKey',
      display: 'API Key',
      component: SecretInputFormik
    },
    {
      code: 'fromNumber',
      display: 'InforU sender',
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
      username: Yup.string('The InforU username must be a string')
        .max(100, 'The InforU username is too long')
        .required('The InforU username is required'),
      apiKey: Yup.string('The API key must be a string')
        .max(200, 'The API key is too long')
        .test(secretTest(account?.apiKey, 'API key')),
      fromNumber: Yup.string('The InforU sender must be a string')
        .max(11, 'The InforU sender is too long')
        .required('The InforU sender is required'),
      toNumber: Yup.string('The notifications number must be a string')
        .max(100, 'The notifications number is too long')
        .required('The notifications number is required')
    })
  }
}
