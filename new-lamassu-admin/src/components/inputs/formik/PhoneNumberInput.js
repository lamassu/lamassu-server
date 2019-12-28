import React, { memo, useState } from 'react'
import { makeStyles } from '@material-ui/core'

import TextInputFormik from './TextInput'
import { styles } from './TextInput.styles'

const useStyles = makeStyles(styles)

const mask = /(\+)(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)(\d{1,3}){0,1}(\d{1,3}){0,1}(\d{1,3}){0,1}(\d{1,3}){0,1}(\d{1,2}){0,1}$/
const maskValue = value =>
  value ? value.replace(mask, '$1 $2 $3 $4 $5 $6') : ''

const PhoneNumberInputFormik = memo(({ ...props }) => {
  const { onChange, value } = props.field

  const classes = useStyles()

  // Regex adapted from http://phoneregex.com/

  const [maskedValue, setMaskedValue] = useState(maskValue(value))

  const handleChange = event => {
    setMaskedValue(maskValue(event.target.value))

    onChange(event)
  }

  return (
    <>
      <span className={classes.masked} aria-hidden="true">
        {maskedValue}
      </span>
      <TextInputFormik
        inputProps={{ maxLength: 17 }}
        className={classes.maskedInput}
        onChange={handleChange}
        {...props}
      />
    </>
  )
})

export { PhoneNumberInputFormik, mask, maskValue }
