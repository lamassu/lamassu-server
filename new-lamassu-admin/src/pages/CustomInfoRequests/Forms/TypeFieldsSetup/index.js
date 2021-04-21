import { useFormikContext } from 'formik'
import * as R from 'ramda'
import * as Yup from 'yup'

import NumericalEntry from './NumericalEntry'
import TextEntry from './TextEntry'

const getForm = dataType => {
  switch (dataType) {
    case 'numerical':
      return <NumericalEntry />
    case 'text':
      return <TextEntry />
    default:
      return <NumericalEntry />
  }
}

const TypeFieldsSetup = () => {
  const dataType = R.path(['values', 'dataType'])(useFormikContext()) ?? null
  return dataType && getForm(dataType)
}

const defaultValues = {
  numericalConstraintType: '',
  numberInputLength: '',
  textConstraintType: ''
}

const validationSchema = Yup.lazy(values => {
  switch (values.dataType) {
    case 'numerical':
      return Yup.object({
        numericalConstraintType: Yup.string().required(),
        numberInputLength: Yup.number().when('numericalConstraintType', {
          is: 'length',
          then: Yup.number()
            .min(0)
            .required(),
          else: Yup.mixed().notRequired()
        })
      })
    case 'text':
      return Yup.object({
        textConstraintType: Yup.string().required()
      })
    default:
      return Yup.mixed().notRequired()
  }
})

export default TypeFieldsSetup
export { defaultValues, validationSchema }
