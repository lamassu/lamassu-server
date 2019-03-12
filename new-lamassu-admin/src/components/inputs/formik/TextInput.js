import React, { memo } from 'react'

import { TextInput } from '../base'

const TextInputFormik = memo(({ ...props }) => {
  const { name, onChange, onBlur, value } = props.field
  const { touched, errors } = props.form

  return (
    <TextInput
      name={name}
      onChange={onChange}
      onBlur={onBlur}
      value={value}
      touched={touched}
      errors={errors}
      {...props}
    />
  )
})

export default TextInputFormik
