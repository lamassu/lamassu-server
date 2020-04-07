import React, { memo, useState } from 'react'

import { TextInput } from '../base'

const SecretInput = memo(({ value, onFocus, onBlur, ...props }) => {
  const [focused, setFocused] = useState(false)

  const placeholder = '⚬ ⚬ ⚬ This field is set ⚬ ⚬ ⚬'
  const previouslyFilled = !!value
  const tempValue = previouslyFilled ? '' : value

  const iOnFocus = event => {
    setFocused(true)
    onFocus && onFocus(event)
  }

  const iOnBlur = event => {
    setFocused(false)
    onBlur && onBlur(event)
  }

  return (
    <TextInput
      {...props}
      type="password"
      onFocus={iOnFocus}
      onBlur={iOnBlur}
      value={value}
      InputProps={{ value: !focused ? tempValue : value }}
      InputLabelProps={{ shrink: previouslyFilled || focused }}
      placeholder={previouslyFilled ? placeholder : ''}
    />
  )
})

export default SecretInput
