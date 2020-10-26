import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

export default {
  code: 'itbit',
  name: 'itBit',
  title: 'itBit (Exchange)',
  elements: [
    {
      code: 'userId',
      display: 'User ID',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'walletId',
      display: 'Wallet ID',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'clientKey',
      display: 'Client Key',
      component: TextInputFormik
    },
    {
      code: 'clientSecret',
      display: 'Client Secret',
      component: SecretInputFormik
    }
  ],
  validationSchema: Yup.object().shape({
    userId: Yup.string()
      .max(100, 'Too long')
      .required(),
    walletId: Yup.string()
      .max(100, 'Too long')
      .required(),
    clientKey: Yup.string()
      .max(100, 'Too long')
      .required(),
    clientSecret: Yup.string()
      .max(100, 'Too long')
      .required()
  })
}
