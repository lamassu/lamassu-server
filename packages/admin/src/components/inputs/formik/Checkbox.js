import React, { memo } from 'react'

import { Checkbox } from '../base'

const CheckboxInput = memo(
  ({
    label,
    textAlign,
    fullWidth,
    enabled = true,
    disabledMessage = '',
    ...props
  }) => {
    const { name, onChange, value } = props.field

    const settings = {
      enabled: enabled,
      label: label,
      disabledMessage: disabledMessage
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
  }
)

export default CheckboxInput
