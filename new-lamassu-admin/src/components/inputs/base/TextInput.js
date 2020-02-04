import React, { memo } from 'react'
import classnames from 'classnames'
import InputAdornment from '@material-ui/core/InputAdornment'
import TextField from '@material-ui/core/TextField'
import { makeStyles } from '@material-ui/core/styles'

import {
  fontColor,
  offColor,
  secondaryColor,
  inputFontSize,
  inputFontSizeLg,
  inputFontWeight,
  inputFontWeightLg
} from 'src/styling/variables'

const useStyles = makeStyles({
  inputRoot: {
    fontSize: inputFontSize,
    color: fontColor,
    fontWeight: inputFontWeight,
    paddingLeft: 4,
    '& > .MuiInputBase-input': {
      width: 282
    }
  },
  inputRootLg: {
    fontSize: inputFontSizeLg,
    color: fontColor,
    fontWeight: inputFontWeightLg,
    '& > .MuiInputBase-input': {
      width: 96
    }
  },
  labelRoot: {
    color: fontColor,
    paddingLeft: 4
  },
  root: {
    '& > .MuiInput-underline:before': {
      borderBottom: [[2, 'solid', fontColor]]
    },
    '& .Mui-focused': {
      color: fontColor
    },
    '& input': {
      paddingTop: 4,
      paddingBottom: 3
    },
    '& .MuiInputBase-inputMultiline': {
      width: 500,
      paddingRight: 20
    }
  },
  empty: {
    '& .MuiInputLabel-root:not(.MuiFormLabel-filled):not(.MuiInputLabel-shrink)': {
      color: offColor
    },
    '& .MuiInputLabel-formControl:not(.MuiInputLabel-shrink)': {
      top: -2
    }
  },
  filled: {
    '& .MuiInput-underline:before': {
      borderBottomColor: secondaryColor
    },
    '& .MuiInput-underline:hover:not(.Mui-disabled)::before': {
      borderBottomColor: secondaryColor
    }
  }
})

const TextInput = memo(
  ({
    name,
    onChange,
    onBlur,
    value,
    error,
    suffix,
    large,
    className,
    InputProps,
    ...props
  }) => {
    const classes = useStyles()

    const classNames = {
      [className]: true,
      [classes.filled]: !error && value,
      [classes.empty]: !value || value === ''
    }

    return (
      <TextField
        id={name}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        value={value}
        classes={{ root: classes.root }}
        className={classnames(classNames)}
        InputProps={{
          className: large ? classes.inputRootLg : classes.inputRoot,
          endAdornment: suffix ? (
            <InputAdornment
              className={classes.inputRoot}
              disableTypography
              position="end">
              {suffix}
            </InputAdornment>
          ) : null,
          ...InputProps
        }}
        InputLabelProps={{ className: classes.labelRoot }}
        {...props}
      />
    )
  }
)

export default TextInput
