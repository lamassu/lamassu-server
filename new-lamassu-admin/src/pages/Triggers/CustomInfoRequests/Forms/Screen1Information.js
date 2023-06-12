import { Field } from 'formik'
import React from 'react'
import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'
import { H4, P } from 'src/components/typography'

const Screen1Information = () => {
  return (
    <>
      <H4>Screen 1 Information</H4>
      <P>
        On the first screen, you will ask whether the user agrees on providing
        this information, or if they wish to end the transaction instead.
      </P>
      <Field
        component={TextInputFormik}
        label="Screen title"
        name="screen1Title"
        fullWidth
      />
      <Field
        component={TextInputFormik}
        label="Screen text"
        name="screen1Text"
        multiline
        fullWidth
        rows={5}
      />
    </>
  )
}

const validationSchema = Yup.object().shape({
  screen1Title: Yup.string()
    .required()
    .label('Screen title'),
  screen1Text: Yup.string()
    .required()
    .label('Screen text')
})

const defaultValues = {
  screen1Title: '',
  screen1Text: ''
}

export default Screen1Information
export { validationSchema, defaultValues }
