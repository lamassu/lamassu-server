import React, { memo } from 'react'
import classnames from 'classnames'
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
import { TL2, Label2, Info1, Info2 } from 'src/components/typography'

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    alignItems: 'baseline',
    '& > p:first-child': {
      margin: [[0, 4, 5, 0]]
    },
    '&> p:last-child': {
      margin: [[0, 0, 0, 3]]
    }
  },
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

const TextInputDisplay = memo(({ display, suffix, large }) => {
  const classes = useStyles()

  return (
    <div className={classes.wrapper}>
      {large && !suffix && <span>{display}</span>}
      {!large && !suffix && <span>{display}</span>}
      {large && suffix && <Info1>{display}</Info1>}
      {!large && suffix && <Info2>{display}</Info2>}
      {suffix && large && <TL2>{suffix}</TL2>}
      {suffix && !large && <Label2>{suffix}</Label2>}
    </div>
  )
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
      <div className={classes.wrapper}>
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
            ...InputProps
          }}
          InputLabelProps={{ className: classes.labelRoot }}
          {...props}
        />
        {suffix && large && (
          <>
            <TL2>{suffix}</TL2>
          </>
        )}
        {suffix && !large && <Label2>{suffix}</Label2>}
      </div>
    )
  }
)

export { TextInput, TextInputDisplay }
