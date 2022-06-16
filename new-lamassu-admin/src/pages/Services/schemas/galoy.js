import * as Yup from 'yup'

import {
  SecretInput,
  TextInput,
  Autocomplete
} from 'src/components/inputs/formik'

import { secretTest } from './helper'

export default {
  code: 'galoy',
  name: 'Galoy',
  title: 'Galoy (Wallet)',
  elements: [
    {
      code: 'apiKey',
      display: 'API Key',
      component: TextInput,
      face: true,
      long: true
    },
    {
      code: 'environment',
      display: 'Environment',
      component: Autocomplete,
      inputProps: {
        options: [
          { code: 'main', display: 'prod' },
          { code: 'test', display: 'test' }
        ],
        labelProp: 'display',
        valueProp: 'code'
      },
      face: true
    },
    {
      code: 'endpoint',
      display: 'Endpoint',
      component: TextInput
    },
    {
      code: 'walletId',
      display: 'Wallet ID',
      component: SecretInput
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The API key must be a string')
        .max(200, 'The API key is too long')
        .required('The API key is required'),
      walletId: Yup.string('The wallet id must be a string')
        .max(100, 'The wallet id is too long')
        .test(secretTest(account?.walletId)),
      environment: Yup.string('The environment must be a string')
        .matches(/(main|test)/)
        .required('The environment is required'),
      endpoint: Yup.string('The endpoint must be a string')
        .max(100, 'The endpoint is too long')
        .required('The endpoint is required')
    })
  }
}
