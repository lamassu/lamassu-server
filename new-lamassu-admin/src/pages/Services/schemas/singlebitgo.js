import * as Yup from 'yup'

import {
  TextInput,
  SecretInput,
  Autocomplete
} from 'src/components/inputs/formik'

const singleBitgo = code => ({
  code: 'bitgo',
  name: 'BitGo',
  title: 'BitGo (Wallet)',
  elements: [
    {
      code: 'token',
      display: 'API Token',
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
          { code: 'prod', display: 'prod' },
          { code: 'test', display: 'test' }
        ],
        labelProp: 'display',
        valueProp: 'code'
      },
      face: true
    },
    {
      code: `${code}WalletId`,
      display: `${code} Wallet ID`,
      component: TextInput
    },
    {
      code: `${code}WalletPassphrase`,
      display: `${code} Wallet Passphrase`,
      component: SecretInput
    }
  ],
  validationSchema: Yup.object().shape({
    token: Yup.string()
      .max(100, 'Too long')
      .required(),
    environment: Yup.string()
      .matches(/(prod|test)/)
      .required(),
    [`${code}WalletId`]: Yup.string()
      .max(100, 'Too long')
      .required(),
    [`${code}WalletPassphrase`]: Yup.string()
      .max(100, 'Too long')
      .required()
  })
})

export default singleBitgo
