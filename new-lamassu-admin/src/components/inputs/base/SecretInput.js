import React, { memo, useState } from 'react'

import { TextInput } from '../base'

const SecretInput = memo(
  ({ value, onFocus, isPasswordFilled, onBlur, ...props }) => {
    const [focused, setFocused] = useState(false)
    const placeholder = '⚬ ⚬ ⚬ This field is set ⚬ ⚬ ⚬'
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
        isPasswordFilled={isPasswordFilled}
        value={value}
        InputProps={{ value: value }}
        InputLabelProps={{ shrink: isPasswordFilled || value || focused }}
        placeholder={isPasswordFilled ? placeholder : ''}
      />
    )
  }
)

export default SecretInput
