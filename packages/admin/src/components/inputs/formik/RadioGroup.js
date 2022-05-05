import React, { memo } from 'react'

import { RadioGroup } from '../base'

const RadioGroupFormik = memo(({ label, ...props }) => {
  const { name, onChange, value } = props.field

  return (
    <RadioGroup
      name={name}
      label={label}
      value={value}
      options={props.options}
      ariaLabel={name}
      onChange={e => {
        onChange(e)
        props.resetError && props.resetError()
      }}
      className={props.className}
      {...props}
    />
  )
})

export default RadioGroupFormik
