import { useFormikContext } from 'formik'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Autocomplete } from '../base'

const AutocompleteFormik = ({ options, ...props }) => {
  const [open, setOpen] = useState(false)

  const { name, onBlur, value } = props.field
  const { touched, errors, setFieldValue } = props.form
  const error = !!(touched[name] && errors[name])
  const { initialValues } = useFormikContext()

  const innerOptions =
    R.type(options) === 'Function' ? options(initialValues) : options

  return (
    <Autocomplete
      name={name}
      onChange={(event, item) => setFieldValue(name, item)}
      onBlur={onBlur}
      value={value}
      error={error}
      open={open}
      options={innerOptions}
      onOpen={() => setOpen(value.length !== props.limit)}
      onClose={() => setOpen(false)}
      {...props}
    />
  )
}

export default AutocompleteFormik
