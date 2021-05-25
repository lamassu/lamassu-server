import React, { memo } from 'react'

import { Checkbox } from '../base'

const CheckboxInput = memo(({ label, textAlign, fullWidth, ...props }) => {
  const { name, onChange, value } = props.field

  const settings = {
    enabled: props.enabled ?? true,
    label: label,
    disabledMessage: props.disabledMessage ?? ''
  }

  return (
    <Checkbox
      name={name}
      onChange={onChange}
      value={value}
      settings={settings}
      {...props}
    />
  )
})

export default CheckboxInput
