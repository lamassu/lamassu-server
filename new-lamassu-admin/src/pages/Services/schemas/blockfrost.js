import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'

import { secretTest } from './helper'

export default {
  code: 'blockfrost',
  name: 'Blockfrost',
  title: 'Blockfrost (Wallet)',
  elements: [
    {
      code: 'projectId',
      display: 'Project ID',
      component: SecretInputFormik
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      projectId: Yup.string('The project id must be a string')
        .max(100, 'The project id is too long')
        .test(secretTest(account?.projectId, 'project id'))
    })
  }
}
