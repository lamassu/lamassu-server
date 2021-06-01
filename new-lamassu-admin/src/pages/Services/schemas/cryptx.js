import * as Yup from 'yup'

import {
  TextInput,
  SecretInput,
  Autocomplete
} from 'src/components/inputs/formik'

export default {
  code: 'cryptx',
  name: 'CryptX',
  title: 'CryptX (Wallet)',
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
      code: 'BTCWalletId',
      display: 'BTC Wallet ID',
      component: TextInput
    },
    {
      code: 'BTCWalletPassphrase',
      display: 'BTC Wallet Passphrase',
      component: SecretInput
    },
    {
      code: 'LTCWalletId',
      display: 'LTC Wallet ID',
      component: TextInput
    },
    {
      code: 'LTCWalletPassphrase',
      display: 'LTC Wallet Passphrase',
      component: SecretInput
    },
    {
      code: 'BCHWalletId',
      display: 'BCH Wallet ID',
      component: TextInput
    },
    {
      code: 'BCHWalletPassphrase',
      display: 'BCH Wallet Passphrase',
      component: SecretInput
    },
    {
      code: 'ETHWalletId',
      display: 'ETH Wallet ID',
      component: TextInput
    },
    {
      code: 'ETHWalletPassphrase',
      display: 'ETH Wallet Passphrase',
      component: SecretInput
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      token: Yup.string()
        .max(100, 'Too long')
        .required(),
      BTCWalletId: Yup.string().max(100, 'Too long'),
      BTCWalletPassphrase: Yup.string(),
      LTCWalletId: Yup.string().max(100, 'Too long'),
      LTCWalletPassphrase: Yup.string(),
      ETHWalletId: Yup.string().max(100, 'Too long'),
      ETHWalletPassphrase: Yup.string(),
      BCHWalletId: Yup.string().max(100, 'Too long'),
      BCHWalletPassphrase: Yup.string(),
      environment: Yup.string()
        .matches(/(prod|test)/)
        .required()
    })
  }
}
