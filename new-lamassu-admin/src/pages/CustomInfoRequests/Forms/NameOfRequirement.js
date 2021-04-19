import { Field } from 'formik'
import React from 'react'
import * as Yup from 'yup'

import { TextInput } from 'src/components/inputs'
import { H4, P } from 'src/components/typography'

const NameOfRequirement = () => {
  return (
    <Field name="requirementName">
      {({ field, form, meta }) => (
        <>
          <H4>Name of the requirement</H4> {/* TODO Add ? icon */}
          <P>
            The name of the requirement will only be visible to you on the
            dashboard on the requirement list, as well as on the custom
            information request list. The user won't see this name. Make sure to
            make it distinguishable and short.
          </P>
          <TextInput
            error={!!meta.error}
            fullWidth
            label="Requirement name"
            {...field}
          />
        </>
      )}
    </Field>
  )
}

const validationSchema = Yup.object().shape({
  requirementName: Yup.string().required()
})

const defaultValues = {
  requirementName: ''
}

export default NameOfRequirement
export { validationSchema, defaultValues }
