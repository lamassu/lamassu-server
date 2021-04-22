import { useFormikContext } from 'formik'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import ChoiceList from './ChoiceList'
import NumericalEntry from './NumericalEntry'
import TextEntry from './TextEntry'

const nonEmptyStr = obj => obj.text && obj.text.length

const getForm = inputType => {
  switch (inputType) {
    case 'numerical':
      return NumericalEntry
    case 'text':
      return TextEntry
    case 'choiceList':
      return ChoiceList
    default:
      return NumericalEntry
  }
}

const TypeFieldsSetup = () => {
  const inputType = R.path(['values', 'inputType'])(useFormikContext()) ?? null
  const Component = getForm(inputType)
  return inputType && <Component />
}

const defaultValues = {
  constraintType: '',
  inputLabel: '',
  inputLength: '',
  listChoices: [{ text: '' }, { text: '' }]
}

const validationSchema = Yup.lazy(values => {
  switch (values.inputType) {
    case 'numerical':
      return Yup.object({
        constraintType: Yup.string().required(),
        inputLength: Yup.number().when('constraintType', {
          is: 'length',
          then: Yup.number()
            .min(0)
            .required(),
          else: Yup.mixed().notRequired()
        })
      })
    case 'text':
      return Yup.object({
        constraintType: Yup.string().required()
      })
    case 'choiceList':
      return Yup.object({
        constraintType: Yup.string().required(),
        listChoices: Yup.array().test(
          'has-2-or-more',
          'Choice list needs to have two or more non empty fields',
          (values, ctx) => {
            return R.filter(nonEmptyStr)(values).length > 1
          }
        )
      })
    default:
      return Yup.mixed().notRequired()
  }
})

export default TypeFieldsSetup
export { defaultValues, validationSchema }
