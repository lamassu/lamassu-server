import { Field } from 'formik'
import React from 'react'
import * as Yup from 'yup'

import { TextInput } from 'src/components/inputs'
import { H4, P } from 'src/components/typography'

const ScreenInformation = () => {
  return (
    <>
      <H4>Screen 2 Information</H4> {/* TODO Add ? icon */}
      <P>
        If the user agrees, on screen 2 is where the user will enter the custom
        information.
      </P>
      <Field name="screen2Title">
        {({ field, form, meta }) => (
          <TextInput
            error={!!meta.error}
            fullWidth
            label="Screen title"
            {...field}
          />
        )}
      </Field>
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
