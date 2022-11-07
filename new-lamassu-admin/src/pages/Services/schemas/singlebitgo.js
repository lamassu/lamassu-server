import * as Yup from 'yup'

import {
  TextInput,
  SecretInput,
  Autocomplete
} from 'src/components/inputs/formik'

const singleBitgo = code => ({
  code: 'bitgo',
  name: 'BitGo',
  category: 'Wallet',
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
    token: Yup.string('The token must be a string')
      .max(100, 'The token is too long')
      .required('The token is required'),
    environment: Yup.string('The environment must be a string')
      .matches(/(prod|test)/)
      .required('The environment is required'),
    [`${code}WalletId`]: Yup.string(`The ${code} wallet ID must be a string`)
      .max(100, `The ${code} wallet ID is too long`)
      .required(`The ${code} wallet ID is required`),
    [`${code}WalletPassphrase`]: Yup.string(
      `The ${code} passphrase must be a string`
    )
      .max(100, `The ${code} wallet passphrase is too long`)
      .required(`The ${code} wallet passphrase is required`)
  })
})

export default singleBitgo
