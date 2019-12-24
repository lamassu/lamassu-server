import InputAdornment from '@material-ui/core/InputAdornment'
import TextField from '@material-ui/core/TextField'
import { makeStyles } from '@material-ui/core/styles'
import React, { memo } from 'react'

import {
  fontColor,
  inputFontSize,
  inputFontSizeLg,
  inputFontWeight
} from '../../../styling/variables'

const useStyles = makeStyles({
  inputRoot: {
    fontSize: inputFontSize,
    color: fontColor,
    fontWeight: inputFontWeight
  },
  inputRootLg: {
    fontSize: inputFontSizeLg,
    color: fontColor,
    fontWeight: inputFontWeight
  },
  labelRoot: {
    color: fontColor
  }
})

const TextInput = memo(
  ({
    name,
    onChange,
    onBlur,
    value,
    touched,
    errors,
    suffix,
    large,
    ...props
  }) => {
    const classes = useStyles()

    return (
      <TextField
        id={name}
        onChange={onChange}
        onBlur={onBlur}
        error={!!(touched[name] && errors[name])}
        value={value}
        classes={{ root: classes.root }}
        InputProps={{
          className: large ? classes.inputRootLg : classes.inputRoot,
          endAdornment: suffix ? (
            <InputAdornment
              className={classes.inputRoot}
              disableTypography
              position="end">
              {suffix}
            </InputAdornment>
          ) : null
        }}
        InputLabelProps={{ className: classes.labelRoot }}
        {...props}
      />
    )
  }
)

export default TextInput
