import React from 'react'

import { Autocomplete } from '../base'

const AutocompleteFormik = props => {
  const { name, onBlur, value } = props.field
  const { touched, errors, setFieldValue } = props.form
  const error = !!(touched[name] && errors[name])

  return (
    <Autocomplete
      name={name}
      onChange={(event, item) => setFieldValue(name, item)}
      onBlur={onBlur}
      value={value}
      error={error}
      {...props}
    />
  )
}

export default AutocompleteFormik
