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
  shouldAdd,
  getOptionSelected,
  forceShowValue,
  value,
  onChange,
  multiple,
  getLabel,
  error,
  fullWidth,
  textAlign,
  size,
  ...props
}) => {
  let iOptions = options

  const compare = getOptionSelected || R.equals
  const find = R.find(it => compare(value, it))

  if (forceShowValue && !multiple && value && !find(options)) {
    iOptions = R.concat(options, [value])
  }

  return (
    <MAutocomplete
      options={iOptions}
      multiple={multiple}
      value={value}
      onChange={onChange}
      getOptionLabel={getLabel}
      forcePopupIcon={false}
      filterOptions={createFilterOptions({ ignoreAccents: true, limit })}
      openOnFocus
      autoHighlight
      disableClearable
      ChipProps={{ onDelete: null }}
      blurOnSelect
      clearOnEscape
      getOptionSelected={getOptionSelected}
      {...props}
      renderInput={params => {
        return (
          <TextInput
            {...params}
            label={label}
            value={value}
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
