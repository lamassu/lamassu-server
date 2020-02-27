import React, { memo, useState } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core'

import TextInputFormik from './TextInput'
import { styles } from './TextInput.styles'

const useStyles = makeStyles(styles)

const SecretInputFormik = memo(({ className, ...props }) => {
  const { value } = props.field

  const classes = useStyles()

  const [localTouched, setLocalTouched] = useState(false)

  const handleFocus = event => {
    setLocalTouched(true)
    props.onFocus()
  }

  const spanClass = {
    [classes.secretSpan]: true,
    [classes.masked]: value && !localTouched,
    [classes.hideSpan]: !value || localTouched
  }

  const inputClass = {
    [classes.maskedInput]: value && !localTouched
  }

  return (
    <>
      <span className={classnames(spanClass)} aria-hidden="true">
        ⚬ ⚬ ⚬ This field is set ⚬ ⚬ ⚬
      </span>
      <TextInputFormik
        {...props}
        onFocus={handleFocus}
        className={classnames(inputClass, className)}
      />
    </>
  )
})

export default SecretInputFormik
