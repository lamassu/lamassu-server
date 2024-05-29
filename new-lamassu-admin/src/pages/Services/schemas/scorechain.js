import * as Yup from 'yup'

import CheckboxFormik from 'src/components/inputs/formik/Checkbox'
import NumberInputFormik from 'src/components/inputs/formik/NumberInput'
import SecretInputFormik from 'src/components/inputs/formik/SecretInput'

import { secretTest, leadingZerosTest } from './helper'

export default {
  code: 'scorechain',
  name: 'Scorechain',
  title: 'Scorechain (Scoring)',
  elements: [
    {
      code: 'apiKey',
      display: 'API Key',
      component: SecretInputFormik
    },
    {
      code: 'scoreThreshold',
      display: 'Score threshold',
      component: NumberInputFormik,
      face: true,
      long: false
    },
    {
      code: 'enabled',
      component: CheckboxFormik,
      settings: {
        enabled: true,
        disabledMessage: 'This plugin is disabled',
        label: 'Enabled',
        requirement: null,
        rightSideLabel: true
      },
      face: true
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The API key must be a string')
        .max(100, 'Too long')
        .test(secretTest(account?.apiKey, 'API key')),
      scoreThreshold: Yup.number('The score threshold must be a number')
        .required('A score threshold is required')
        .min(1, 'The score threshold must be between 1 and 100')
        .max(100, 'The score threshold must be between 1 and 100')
        .integer('The score threshold must be an integer')
        .test(
          'no-leading-zeros',
          'The score threshold must not have leading zeros',
          leadingZerosTest
        )
    })
  }
}
