import * as Yup from 'yup'

import CheckboxInput from 'src/components/inputs/formik/Checkbox'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

export default {
  code: 'blockcypher',
  name: 'Blockcypher',
  title: 'Blockcypher (Payments)',
  elements: [
    {
      code: 'token',
      display: 'API Token',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'confidenceFactor',
      display: 'Confidence Factor',
      component: TextInputFormik,
      face: true
    },
    {
      code: 'rbf',
      component: CheckboxInput,
      settings: {
        field: 'wallets_BTC_wallet',
        enabled: true,
        disabledMessage:
          'Lower the confidence of RBF transactions (Available when using bitcoind.)',
        label: 'Lower the confidence of RBF transactions',
        requirement: 'bitcoind',
        rightSideLabel: true
      },
      face: true
    }
  ],
  getValidationSchema: () => {
    return Yup.object().shape({
      token: Yup.string()
        .max(100, 'Too long')
        .required(),
      confidenceFactor: Yup.number()
        .integer('Please input a positive integer')
        .positive('Please input a positive integer')
        .required()
    })
  }
}
