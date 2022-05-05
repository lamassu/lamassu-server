import React, { memo } from 'react'

import { SecretInput } from '../base'

const SecretInputFormik = memo(({ isPasswordFilled, ...props }) => {
  const { name, onChange, onBlur, value } = props.field
  const { touched, errors } = props.form

  const error = !isPasswordFilled && !!(touched[name] && errors[name])

  return (
    <SecretInput
      name={name}
      isPasswordFilled={isPasswordFilled}
      onChange={onChange}
      onBlur={onBlur}
      value={value}
      error={error}
      {...props}
    />
  )
})

export default SecretInputFormik
