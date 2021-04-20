import { Field } from 'formik'
import React from 'react'
import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'
import { H4, P } from 'src/components/typography'

const ScreenInformation = () => {
  return (
    <>
      <H4>Screen 2 Information</H4> {/* TODO Add ? icon */}
      <P>
        If the user agrees, on screen 2 is where the user will enter the custom
        information.
      </P>
      <Field
        component={TextInputFormik}
        label="Screen 2 title"
        name="screen2Title"
        fullWidth
      />
    </>
  )
}

const validationSchema = Yup.object().shape({
  screen2Title: Yup.string().required()
})

const defaultValues = {
  screen2Title: '.'
}

export default ScreenInformation
export { validationSchema, defaultValues }
