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
      },
      face: true
    },
    {
      code: 'btcWalletId',
      display: 'BTC Wallet ID',
      component: TextInput
    },
    {
      code: 'btcWalletPassphrase',
      display: 'BTC Wallet Passphrase',
      component: SecretInput
    },
    {
      code: 'ltcWalletId',
      display: 'LTC Wallet ID',
      component: TextInput
    },
    {
      code: 'ltcWalletPassphrase',
      display: 'LTC Wallet Passphrase',
      component: SecretInput
    },
    {
      code: 'zecWalletId',
      display: 'ZEC Wallet ID',
      component: TextInput
    },
    {
      code: 'zecWalletPassphrase',
      display: 'ZEC Wallet Passphrase',
      component: SecretInput
    },
    {
      code: 'bchWalletId',
      display: 'BCH Wallet ID',
      component: TextInput
    },
    {
      code: 'bchWalletPassphrase',
      display: 'BCH Wallet Passphrase',
      component: SecretInput
    },
    {
      code: 'dashWalletId',
      display: 'DASH Wallet ID',
      component: TextInput
    },
    {
      code: 'dashWalletPassphrase',
      display: 'DASH Wallet Passphrase',
      component: SecretInput
    }
  ],
  validationSchema: Yup.object().shape({
    token: Yup.string()
      .max(100, 'Too long')
      .required('Required'),
    btcWalletId: Yup.string().max(100, 'Too long'),
    btcWalletPassphrase: Yup.string()
      .max(100, 'Too long')
      .when('btcWalletId', {
        is: isDefined,
        then: Yup.string().required()
      }),
    ltcWalletId: Yup.string().max(100, 'Too long'),
    ltcWalletPassphrase: Yup.string()
      .max(100, 'Too long')
      .when('ltcWalletId', {
        is: isDefined,
        then: Yup.string().required()
      }),
    zecWalletId: Yup.string().max(100, 'Too long'),
    zecWalletPassphrase: Yup.string()
      .max(100, 'Too long')
      .when('zecWalletId', {
        is: isDefined,
        then: Yup.string().required()
      }),
    bchWalletId: Yup.string().max(100, 'Too long'),
    bchWalletPassphrase: Yup.string()
      .max(100, 'Too long')
      .when('bchWalletId', {
        is: isDefined,
        then: Yup.string().required()
      }),
    dashWalletId: Yup.string().max(100, 'Too long'),
    dashWalletPassphrase: Yup.string()
      .max(100, 'Too long')
      .when('dashWalletId', {
        is: isDefined,
        then: Yup.string().required()
      }),
    environment: Yup.string()
      .matches(/(prod|test)/)
      .required('Required')
  })
}
