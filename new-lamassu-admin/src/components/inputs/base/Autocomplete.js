import MAutocomplete, {
  createFilterOptions
} from '@material-ui/lab/Autocomplete'
import * as R from 'ramda'
import React from 'react'

import TextInput from './TextInput'

const Autocomplete = ({
  limit = 5,
  options,
  label,
  valueProp,
  multiple,
  onChange,
  getLabel,
  value: outsideValue,
  error,
  fullWidth,
  textAlign,
  size,
  ...props
}) => {
  const mapFromValue = options => it => R.find(R.propEq(valueProp, it))(options)
  const mapToValue = R.prop(valueProp)

  const getValue = () => {
    if (!valueProp) return outsideValue

    const transform = multiple
      ? R.map(mapFromValue(options))
      : mapFromValue(options)

    return transform(outsideValue)
  }

  const value = getValue()

  const innerOnChange = (evt, value) => {
    if (!valueProp) return onChange(evt, value)

    const rValue = multiple ? R.map(mapToValue)(value) : mapToValue(value)
    onChange(evt, rValue)
  }

  return (
    <MAutocomplete
      options={options}
      multiple={multiple}
      value={value}
      onChange={innerOnChange}
      getOptionLabel={getLabel}
      forcePopupIcon={false}
      filterOptions={createFilterOptions({ ignoreAccents: true, limit })}
      openOnFocus
      autoHighlight
      disableClearable
      ChipProps={{ onDelete: null }}
      blurOnSelect
      clearOnEscape
      getOptionSelected={R.eqProps(valueProp)}
      {...props}
      renderInput={params => {
        return (
          <TextInput
            {...params}
            label={label}
            value={outsideValue}
            error={error}
            size={size}
            fullWidth={fullWidth}
            textAlign={textAlign}
            {...props}
          />
        )
      }}
    />
  )
}

export default Autocomplete
