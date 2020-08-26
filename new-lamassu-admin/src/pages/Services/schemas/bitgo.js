import * as Yup from 'yup'

import {
  TextInput,
  SecretInput,
  Autocomplete
} from 'src/components/inputs/formik'

const isDefined = it => it && it.length

export default {
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
        // valueProp: 'deviceId',
        // getLabel: R.path(['name']),
        // limit: null
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
      code: 'ZECWalletId',
      display: 'ZEC Wallet ID',
      component: TextInput
    },
    {
      code: 'ZECWalletPassphrase',
      display: 'ZEC Wallet Passphrase',
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
      code: 'DASHWalletId',
      display: 'DASH Wallet ID',
      component: TextInput
    },
    {
      code: 'DASHWalletPassphrase',
      display: 'DASH Wallet Passphrase',
      component: SecretInput
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
    ZECWalletId: Yup.string().max(100, 'Too long'),
    ZECWalletPassphrase: Yup.string()
      .max(100, 'Too long')
      .when('ZECWalletId', {
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
    DASHWalletId: Yup.string().max(100, 'Too long'),
    DASHWalletPassphrase: Yup.string()
      .max(100, 'Too long')
      .when('DASHWalletId', {
        is: isDefined,
        then: Yup.string().required()
      }),
    environment: Yup.string()
      .matches(/(prod|test)/)
      .required('Required')
  })
}
