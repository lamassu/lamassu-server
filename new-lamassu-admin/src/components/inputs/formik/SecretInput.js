import React, { memo } from 'react'

import { SecretInput } from '../base'

const SecretInputFormik = memo(({ ...props }) => {
  const { name, onChange, onBlur, value } = props.field
  const { touched, errors } = props.form

  const error = !!(touched[name] && errors[name])

  return (
    <SecretInput
      name={name}
      onChange={onChange}
      onBlur={onBlur}
      value={value}
      error={error}
      {...props}
    />
  )
})

export default SecretInputFormik
