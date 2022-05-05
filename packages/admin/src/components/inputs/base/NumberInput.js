import React, { memo } from 'react'
import NumberFormat from 'react-number-format'

import TextInput from './TextInput'

const NumberInput = memo(
  ({
    name,
    onChange,
    onBlur,
    value,
    error,
    suffix,
    textAlign,
    width,
    // lg or sm
    size,
    bold,
    className,
    decimalPlaces,
    InputProps,
    ...props
  }) => {
    return (
      <NumberFormat
        name={name}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        error={error}
        suffix={suffix}
        textAlign={textAlign}
        width={width}
        // lg or sm
        size={size}
        bold={bold}
        className={className}
        customInput={TextInput}
        decimalScale={decimalPlaces}
        onValueChange={values => {
          onChange({
            target: {
              id: name,
              value: values.floatValue
            }
          })
        }}
        {...props}
      />
    )
  }
)

export default NumberInput
