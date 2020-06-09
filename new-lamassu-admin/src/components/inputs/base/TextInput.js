import { makeStyles } from '@material-ui/core'
import TextField from '@material-ui/core/TextField'
import classnames from 'classnames'
import * as R from 'ramda'
import React, { memo } from 'react'

import styles from './TextInput.styles'

const useStyles = makeStyles(styles)

const TextInput = memo(
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
    InputProps,
    ...props
  }) => {
    const classes = useStyles({ textAlign, width, size })
    const filled = !error && !R.isNil(value) && !R.isEmpty(value)

    const inputClasses = {
      [classes.bold]: bold
    }

    return (
      <TextField
        id={name}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        value={value}
        classes={{ root: classes.root }}
        className={className}
        InputProps={{
          className: classnames(inputClasses),
          classes: {
            root: classes.size,
            underline: filled ? classes.underline : null
          },
          ...InputProps
        }}
        {...props}
      />
    )
  }
)

export default TextInput
