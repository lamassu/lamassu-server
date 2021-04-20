import { useFormikContext } from 'formik'
import * as R from 'ramda'
import * as Yup from 'yup'

import TypeFieldsSetupInternal from './TypeFieldsSetup'

const TypeFieldsSetup = () => {
  const dataType = R.path(['values', 'dataType'])(useFormikContext()) ?? null
  return dataType && <TypeFieldsSetupInternal dataType={dataType} />
}

const defaultValues = {
  numericalConstraintType: '',
  numberInputLength: ''
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
    default:
      return Yup.mixed().notRequired()
  }
})

export default TypeFieldsSetup
export { defaultValues, validationSchema }
