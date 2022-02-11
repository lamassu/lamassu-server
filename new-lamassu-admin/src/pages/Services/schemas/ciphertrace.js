import * as Yup from 'yup'

import CheckboxFormik from 'src/components/inputs/formik/Checkbox'
import NumberInputFormik from 'src/components/inputs/formik/NumberInput'
import SecretInputFormik from 'src/components/inputs/formik/SecretInput'

import secretTest from './helper'

export default {
  code: 'ciphertrace',
  name: 'CipherTrace',
  title: 'CipherTrace (Scoring)',
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
      long: true
    },
    {
      code: 'enabled',
      component: CheckboxFormik,
      settings: {
        enabled: true,
        disabledMessage: 'This plugin is disabled',
        label: 'Enabled',
        requirement: null
      },
      face: true
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      authorizationValue: Yup.string('The score threshold must be a string')
        .required('The authorization value is required')
        .max(100, 'Too long')
        .test(secretTest(account?.authorizationValue)),
      scoreThreshold: Yup.number('The score threshold must be a number')
        .required('A score threshold is required')
        .min(1, 'The number should be between 1 and 10')
        .max(10, 'The number should be between 1 and 10')
        .test(secretTest(account?.scoreThreshold))
    })
  }
}
