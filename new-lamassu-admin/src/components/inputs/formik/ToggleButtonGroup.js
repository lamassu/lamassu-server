import React, { memo } from 'react'

import { ToggleButtonGroup } from '../base'

const ToggleButtonGroupFormik = memo(({ ...props }) => {
  const { name, onChange, value } = props.field
  return (
    <ToggleButtonGroup
      name={name}
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

export default ToggleButtonGroupFormik
