import * as Yup from 'yup'

import {
  TextInput,
  SecretInput,
  Autocomplete
} from 'src/components/inputs/formik'

const isDefined = it => it && it.length

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
        options: ['prod', 'test']
      },
      face: true
    },
    {
      code: 'BTCWalletId',
      display: 'BTC Wallet ID',
      component: TextInput
    },
    {
      code: 'LTCWalletId',
      display: 'LTC Wallet ID',
      component: TextInput
    },
    {
      code: 'BCHWalletId',
      display: 'BCH Wallet ID',
      component: TextInput
    },
    {
      code: 'ETHWalletId',
      display: 'ETH Wallet ID',
      component: TextInput
    }
  ],
  validationSchema: Yup.object().shape({
    token: Yup.string()
      .max(100, 'Too long')
      .required('Required'),
    BTCWalletId: Yup.string().max(100, 'Too long'),
    BTCWalletPassphrase: Yup.string()
      .max(100, 'Too long')
      .when('BTCWalletId', {
        is: isDefined,
        then: Yup.string().required()
      }),
    LTCWalletId: Yup.string().max(100, 'Too long'),
    LTCWalletPassphrase: Yup.string()
      .max(100, 'Too long')
      .when('LTCWalletId', {
        is: isDefined,
        then: Yup.string().required()
      }),
    BCHWalletId: Yup.string().max(100, 'Too long'),
    BCHWalletPassphrase: Yup.string()
      .max(100, 'Too long')
      .when('BCHWalletId', {
        is: isDefined,
        then: Yup.string().required()
      }),
    ETHWalletId: Yup.string().max(100, 'Too long'),
    ETHWalletPassphrase: Yup.string()
      .max(100, 'Too long')
      .when('ETHWalletId', {
        is: isDefined,
        then: Yup.string().required()
      }),
    environment: Yup.string()
      .matches(/(prod|test)/)
      .required('Required')
  })
}
