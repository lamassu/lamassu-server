import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'
import OtpInput from 'react-otp-input'

import typographyStyles from 'src/components/typography/styles'

import styles from './CodeInput.styles'

const useStyles = makeStyles(styles)
const useTypographyStyles = makeStyles(typographyStyles)

const CodeInput = ({
  name,
  value,
  onChange,
  numInputs,
  error,
  inputStyle,
  containerStyle,
  ...props
}) => {
  const classes = useStyles()
  const typographyClasses = useTypographyStyles()

  return (
    <OtpInput
      id={name}
      value={value}
      onChange={onChange}
      numInputs={numInputs}
      separator={<span> </span>}
      containerStyle={classnames(containerStyle, classes.container)}
      inputStyle={classnames(
        inputStyle,
        classes.input,
        typographyClasses.confirmationCode
      )}
      focusStyle={classes.focus}
      errorStyle={classes.error}
      hasErrored={error}
      isInputNum={true}
      {...props}
    />
  )
}

export default CodeInput
