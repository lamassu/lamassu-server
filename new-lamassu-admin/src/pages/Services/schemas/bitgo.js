import * as Yup from 'yup'

import {
  TextInput,
  SecretInput,
  Autocomplete
} from 'src/components/inputs/formik'

import secretTest from './helper'

const isDefined = it => it && it.length

const buildTestValidation = (id, passphrase) => {
  return Yup.string()
    .max(100, 'Too long')
    .when(id, {
      is: isDefined,
      then: Yup.string().test(secretTest(passphrase))
    })
}

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
  getValidationSchema: account => {
    return Yup.object().shape({
      token: Yup.string()
        .max(100, 'Too long')
        .required(),
      BTCWalletId: Yup.string().max(100, 'Too long'),
      BTCWalletPassphrase: buildTestValidation(
        'BTCWalletId',
        account?.BTCWalletPassphrase
      ),
      LTCWalletId: Yup.string().max(100, 'Too long'),
      LTCWalletPassphrase: buildTestValidation(
        'LTCWalletId',
        account?.LTCWalletPassphrase
      ),
      ZECWalletId: Yup.string().max(100, 'Too long'),
      ZECWalletPassphrase: buildTestValidation(
        'ZECWalletId',
        account?.ZECWalletPassphrase
      ),
      BCHWalletId: Yup.string().max(100, 'Too long'),
      BCHWalletPassphrase: buildTestValidation(
        'BCHWalletId',
        account?.BCHWalletPassphrase
      ),
      DASHWalletId: Yup.string().max(100, 'Too long'),
      DASHWalletPassphrase: buildTestValidation(
        'DASHWalletId',
        account?.DASHWalletPassphrase
      ),
      environment: Yup.string()
        .matches(/(prod|test)/)
        .required()
    })
  }
}
