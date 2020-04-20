import React, { memo, useState } from 'react'

import { TextInput } from '../base'

const SecretInput = memo(({ value, onFocus, onBlur, ...props }) => {
  const [focused, setFocused] = useState(false)

  const placeholder = '⚬ ⚬ ⚬ This field is set ⚬ ⚬ ⚬'
  const previouslyFilled = !!value
  const tempValue = previouslyFilled ? '' : value

  const innerOnFocus = event => {
    setFocused(true)
    onFocus && onFocus(event)
  }

  const innerOnBlur = event => {
    setFocused(false)
    onBlur && onBlur(event)
  }

  return (
    <TextInput
      {...props}
      type="password"
      onFocus={innerOnFocus}
      onBlur={innerOnBlur}
      value={value}
      InputProps={{ value: !focused ? tempValue : value }}
      InputLabelProps={{ shrink: previouslyFilled || focused }}
      placeholder={previouslyFilled ? placeholder : ''}
    />
  )
})

export default SecretInput
