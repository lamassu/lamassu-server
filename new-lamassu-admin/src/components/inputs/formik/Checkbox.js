import React, { memo } from 'react'

import { Checkbox } from '../base'

const CheckboxInput = memo(({ label, textAlign, fullWidth, ...props }) => {
  const { name, onChange, value } = props.field

  return <Checkbox name={name} onChange={onChange} value={value} {...props} />
})

export default CheckboxInput
