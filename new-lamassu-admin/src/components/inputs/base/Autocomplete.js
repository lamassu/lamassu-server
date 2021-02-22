import MAutocomplete from '@material-ui/lab/Autocomplete'
import sort from 'match-sorter'
import * as R from 'ramda'
import React from 'react'

import TextInput from './TextInput'

const Autocomplete = ({
  optionsLimit = 5, // set limit = null for no limit
  limit,
  options,
  label,
  valueProp,
  multiple,
  onChange,
  labelProp,
  keepOpenProp,
  value: outsideValue,
  error,
  fullWidth,
  textAlign,
  size,
  autoFocus,
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

  const valueArray = () => {
    if (R.isNil(value)) return []
    return multiple ? value : [value]
  }

  const filter = (array, input) => {
    if (!input) return array
    return sort(array, input, { keys: [valueProp, labelProp] })
  }

  const filterOptions = (array, { inputValue }) =>
    R.union(
      R.isEmpty(inputValue) ? valueArray() : [],
      filter(array, inputValue)
    ).slice(
      0,
      R.defaultTo(undefined)(limit) &&
        Math.max(limit, R.isEmpty(inputValue) ? valueArray().length : 0)
    )

  return (
    <MAutocomplete
      options={options}
      multiple={multiple}
      value={value}
      onChange={innerOnChange}
      getOptionLabel={R.path([labelProp])}
      forcePopupIcon={false}
      filterOptions={filterOptions}
      openOnFocus
      autoHighlight
      disableClearable
      ChipProps={{ onDelete: null }}
      clearOnEscape
      getOptionSelected={R.eqProps(valueProp)}
      {...props}
      renderInput={params => {
        return (
          <TextInput
            {...params}
            autoFocus={autoFocus}
            label={label}
            value={outsideValue}
            error={error}
            size={size}
            fullWidth={fullWidth}
            textAlign={textAlign}
          />
        )
      }}
    />
  )
}

export default Autocomplete
