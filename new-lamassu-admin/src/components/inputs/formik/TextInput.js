import React, { memo } from 'react'

import { TextInput } from '../base'

const TextInputFormik = memo(({ ...props }) => {
  const { name, onChange, onBlur, value } = props.field
  const { touched, errors } = props.form

  const error = !!(touched[name] && errors[name])

  return (
    <TextInput
      name={name}
      onChange={onChange}
      onBlur={onBlur}
      value={value}
      error={error}
      {...props}
    />
  )
})

export default TextInputFormik
