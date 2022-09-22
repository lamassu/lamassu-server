import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { secretTest } from './helper'

const schema = cryptos => {
  return {
    code: 'infura',
    name: 'Infura',
    category: 'Wallet',
    allowMultiInstances: true,
    elements: [
      {
        code: 'apiKey',
        display: 'Project ID',
        component: TextInputFormik,
        face: true,
        long: true
      },
      {
        code: 'apiSecret',
        display: 'Project Secret',
        component: SecretInputFormik
      },
      {
        code: 'endpoint',
        display: 'Endpoint',
        component: TextInputFormik,
        face: true
      }
    ],
    getValidationSchema: account => {
      return Yup.object().shape({
        apiKey: Yup.string('The project ID must be a string')
          .max(100, 'The project ID is too long')
          .required('The project ID is required'),
        apiSecret: Yup.string('The project secret must be a string')
          .max(100, 'The project secret is too long')
          .test(secretTest(account?.apiSecret, 'project secret')),
        endpoint: Yup.string('The endpoint must be a string')
          .max(100, 'The endpoint is too long')
          .required('The endpoint is required')
      })
    }
  }
}

export default schema
