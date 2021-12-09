import React, { memo } from 'react'

import { ToggleButtonGroup } from '../base'

const ToggleButtonGroupFormik = memo(({ enforceValueSet = true, ...props }) => {
  const { name, value } = props.field
  const { setFieldValue } = props.form
  return (
    <ToggleButtonGroup
      name={name}
      value={value}
      options={props.options}
      ariaLabel={name}
      onChange={(e, value) => {
        // enforceValueSet prevents you from not having any button selected
        // after selecting one the first time
        if (enforceValueSet && !value) return null
        setFieldValue(name, value)
        props.resetError && props.resetError()
      }}
      className={props.className}
      {...props}
    />
  )
})

export default ToggleButtonGroupFormik
