import React, { memo } from 'react'

import { Dropdown } from '../base'

const RadioGroupFormik = memo(({ label, ...props }) => {
  const { name, value } = props.field
  const { setFieldValue } = props.form
  return (
    <Dropdown
      name={name}
      label={label}
      value={value}
      options={props.options}
      ariaLabel={name}
      onChange={e => {
        setFieldValue(name, e.target.value)
        props.resetError && props.resetError()
      }}
      className={props.className}
      {...props}
    />
  )
})

export default RadioGroupFormik
