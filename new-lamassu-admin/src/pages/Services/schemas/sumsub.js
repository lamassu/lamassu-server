import * as Yup from 'yup'

import { SecretInput, TextInput } from 'src/components/inputs/formik'

import { secretTest } from './helper'

const schema = {
  code: 'sumsub',
  name: 'Sumsub',
  title: 'Sumsub (Compliance)',
  elements: [
    {
      code: 'apiToken',
      display: 'API Token',
      component: SecretInput
    },
    {
      code: 'secretKey',
      display: 'Secret Key',
      component: SecretInput
    },
    {
      code: 'applicantLevel',
      display: 'Applicant Level',
      component: TextInput,
      face: true
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      apiToken: Yup.string('The API token must be a string')
        .max(100, 'The API token is too long')
        .test(secretTest(account?.apiToken, 'API token')),
      secretKey: Yup.string('The secret key must be a string')
        .max(100, 'The secret key is too long')
        .test(secretTest(account?.secretKey, 'secret key')),
      applicantLevel: Yup.string('The applicant level must be a string')
        .max(100, 'The applicant level is too long')
        .required('The applicant level is required')
    })
  }
}

export default schema
