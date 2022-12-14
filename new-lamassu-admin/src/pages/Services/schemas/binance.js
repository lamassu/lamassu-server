import * as Yup from 'yup'

import {
  SecretInput,
  TextInput,
  Autocomplete
} from 'src/components/inputs/formik'

import { secretTest, buildCurrencyOptions } from './helper'

const schema = markets => {
  return {
    code: 'binance',
    name: 'Binance',
    title: 'Binance (Exchange)',
    elements: [
      {
        code: 'apiKey',
        display: 'API key',
        component: TextInput,
        face: true,
        long: true
      },
      {
        code: 'privateKey',
        display: 'Private key',
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
        apiKey: Yup.string('The API key must be a string')
          .max(100, 'The API key is too long')
          .required('The API key is required'),
        privateKey: Yup.string('The private key must be a string')
          .max(100, 'The private key is too long')
          .test(secretTest(account?.privateKey, 'private key')),
        currencyMarket: Yup.string(
          'The currency market must be a string'
        ).required('The currency market is required')
      })
    }
  }
}

export default schema
