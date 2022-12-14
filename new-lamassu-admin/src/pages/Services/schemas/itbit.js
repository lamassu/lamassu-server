import * as Yup from 'yup'

import {
  SecretInput,
  TextInput,
  Autocomplete
} from 'src/components/inputs/formik'

import { buildCurrencyOptions, secretTest } from './helper'

const schema = markets => {
  return {
    code: 'itbit',
    name: 'itBit',
    title: 'itBit (Exchange)',
    elements: [
      {
        code: 'userId',
        display: 'User ID',
        component: TextInput,
        face: true,
        long: true
      },
      {
        code: 'walletId',
        display: 'Wallet ID',
        component: TextInput,
        face: true,
        long: true
      },
      {
        code: 'clientKey',
        display: 'Client key',
        component: TextInput
      },
      {
        code: 'clientSecret',
        display: 'Client secret',
        component: SecretInput
      },
      {
        code: 'currencyMarket',
        display: 'Currency market',
        component: Autocomplete,
        inputProps: {
          options: buildCurrencyOptions(markets),
          labelProp: 'display',
          valueProp: 'code'
        },
        face: true
      }
    ],
    getValidationSchema: account => {
      return Yup.object().shape({
        userId: Yup.string('The user ID must be a string')
          .max(100, 'The user ID is too long')
          .required('The user ID is required'),
        walletId: Yup.string('The wallet ID must be a string')
          .max(100, 'The wallet ID is too long')
          .required('The wallet ID is required'),
        clientKey: Yup.string('The client key must be a string')
          .max(100, 'The client key is too long')
          .required('The client key is required'),
        clientSecret: Yup.string('The client secret must be a string')
          .max(100, 'The client secret is too long')
          .test(secretTest(account?.clientSecret, 'client secret')),
        currencyMarket: Yup.string(
          'The currency market must be a string'
        ).required('The currency market is required')
      })
    }
  }
}

export default schema
