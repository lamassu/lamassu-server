import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

const isDefined = it => it && it.length

export default {
  code: 'bitgo',
  name: 'BitGo',
  title: 'BitGo (Wallet)',
  elements: [
    {
      code: 'token',
      display: 'API Token',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'environment',
      display: 'Environment',
      component: TextInputFormik,
      face: true
    },
    {
      code: 'btcWalletId',
      display: 'BTC Wallet ID',
      component: TextInputFormik
    },
    {
      code: 'btcWalletPassphrase',
      display: 'BTC Wallet Passphrase',
      component: SecretInputFormik
    },
    {
      code: 'ltcWalletId',
      display: 'LTC Wallet ID',
      component: TextInputFormik
    },
    {
      code: 'ltcWalletPassphrase',
      display: 'LTC Wallet Passphrase',
      component: SecretInputFormik
    },
    {
      code: 'zecWalletId',
      display: 'ZEC Wallet ID',
      component: TextInputFormik
    },
    {
      code: 'zecWalletPassphrase',
      display: 'ZEC Wallet Passphrase',
      component: SecretInputFormik
    },
    {
      code: 'bchWalletId',
      display: 'BCH Wallet ID',
      component: TextInputFormik
    },
    {
      code: 'bchWalletPassphrase',
      display: 'BCH Wallet Passphrase',
      component: SecretInputFormik
    },
    {
      code: 'dashWalletId',
      display: 'DASH Wallet ID',
      component: TextInputFormik
    },
    {
      code: 'dashWalletPassphrase',
      display: 'DASH Wallet Passphrase',
      component: SecretInputFormik
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
