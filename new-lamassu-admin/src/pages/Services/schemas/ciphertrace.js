import * as Yup from 'yup'

import NumberInputFormik from 'src/components/inputs/formik/NumberInput'
import SecretInputFormik from 'src/components/inputs/formik/SecretInput'

import { secretTest, leadingZerosTest } from './helper'

export default {
  code: 'ciphertrace',
  name: 'CipherTrace',
  category: 'Scoring',
  allowMultiInstances: false,
  elements: [
    {
      code: 'authorizationValue',
      display: 'Authorization value',
      component: SecretInputFormik
    },
    {
      code: 'scoreThreshold',
      display: 'Score threshold',
      component: NumberInputFormik,
      face: true,
      long: false
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      authorizationValue: Yup.string('The authorization value must be a string')
        .max(100, 'Too long')
        .test(secretTest(account?.authorizationValue, 'authorization value')),
      scoreThreshold: Yup.number('The score threshold must be a number')
        .required('A score threshold is required')
        .min(1, 'The score threshold must be between 1 and 10')
        .max(10, 'The score threshold must be between 1 and 10')
        .integer('The score threshold must be an integer')
        .test(
          'no-leading-zeros',
          'The score threshold must not have leading zeros',
          leadingZerosTest
        )
    })
  }
}
