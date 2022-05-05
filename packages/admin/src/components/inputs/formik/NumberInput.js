import React, { memo } from 'react'

import { NumberInput } from '../base'

const NumberInputFormik = memo(({ decimalPlaces, ...props }) => {
  const { name, onChange, onBlur, value } = props.field
  const { touched, errors } = props.form

  const error = !!(touched[name] && errors[name])

  return (
    <NumberInput
      name={name}
      onChange={onChange}
      onBlur={onBlur}
      value={value}
      error={error}
      decimalPlaces={decimalPlaces}
      {...props}
    />
  )
})

export default NumberInputFormik
