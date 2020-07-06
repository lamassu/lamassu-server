import {
  TextInput,
  SecretInput,
  Autocomplete
} from 'src/components/inputs/formik'

import bitgo from './bitgo'

export default code => ({
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
        options: ['prod', 'test']
      },
      face: true
    },
    {
      code: `${code.toLowerCase()}WalletId`,
      display: `${code.toUpperCase()} Wallet ID`,
      component: TextInput
    },
    {
      code: `${code.toLowerCase()}WalletPassphrase`,
      display: `${code.toUpperCase()} Wallet Passphrase`,
      component: SecretInput
    }
  ],
  validationSchema: bitgo.validationSchema
})
