import { Field } from 'formik'
import React from 'react'
import * as Yup from 'yup'

import { TextInput } from 'src/components/inputs'
import { H4, P } from 'src/components/typography'

const ScreenInformation = () => {
  return (
    <>
      <H4>Screen 1 Information</H4>
      <P>
        On screen 1 you will request the user if he agrees on providing this
        information, or if he wishes to terminate the transaction instead.
      </P>
      <Field name="screenTitle">
        {({ field, form, meta }) => (
          <TextInput
            error={!!meta.error}
            fullWidth
            label="Screen title"
            {...field}
          />
        )}
      </Field>
      {/*       <Field name="screenText">
        {({ field, form, meta }) => (
          <TextInput
            error={!!meta.error}
            multiline
            fullWidth
            rows={5}
            label="Screen text"
            {...field}
          />
        )}
      </Field> */}
    </>
  )
}

const validationSchema = Yup.object().shape({
  screenTitle: Yup.string().required() /* ,
  screenText: Yup.string().required() */
})

const defaultValues = {
  screenTitle: '' /* ,
  screenText: '' */
}

export default ScreenInformation
export { validationSchema, defaultValues }
