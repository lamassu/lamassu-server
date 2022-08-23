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
      token: Yup.string('The token must be a string')
        .max(100, 'The token is too long')
        .required('The token is required'),
      confidenceFactor: Yup.number('The confidence factor must be a number')
        .integer('The confidence factor must be an integer')
        .min(0, 'The confidence factor must be between 0 and 100')
        .max(100, 'The confidence factor must be between 0 and 100')
        .required('The confidence factor is required')
    })
  }
}
