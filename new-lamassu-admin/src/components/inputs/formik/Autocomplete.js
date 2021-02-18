import { useFormikContext } from 'formik'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Autocomplete } from '../base'

const AutocompleteFormik = ({ options, onChange, ...props }) => {
  const [open, setOpen] = useState(false)

  const { keepopen } = props
  const { name, onBlur, value } = props.field
  const { touched, errors, setFieldValue, setFieldTouched } = props.form
  const error = !!(touched[name] && errors[name])
  const { initialValues, values } = useFormikContext()

  const innerOptions =
    R.type(options) === 'Function' ? options(initialValues, values) : options

  const innerOnBlur = event => {
    name && setFieldTouched(name, true)
    onBlur && onBlur(event)
  }
  const onChangeHandler = value => setFieldValue(name, value)

  return (
    <Autocomplete
      name={name}
      onChange={(event, item) => {
        if (onChange) return onChange(value, item, onChangeHandler)
        setFieldValue(name, item)
      }}
      onBlur={innerOnBlur}
      value={value}
      error={error}
      open={open}
      options={innerOptions}
      onOpen={() => {
        if (!props.multiple) return setOpen(true)
        setOpen(value?.length !== props.limit)
      }}
      onClose={(event, reason) => {
        if (!!keepopen && reason !== 'blur') setOpen(true)
        else setOpen(false)
      }}
      {...props}
    />
  )
}

export default AutocompleteFormik
