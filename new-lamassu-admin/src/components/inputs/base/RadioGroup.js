import {
  Radio,
  RadioGroup as MRadioGroup,
  FormControlLabel,
  makeStyles
} from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import { Label1 } from 'src/components/typography'

const styles = {
  label: {
    height: 16,
    lineHeight: '16px',
    margin: [[0, 0, 4, 0]],
    paddingLeft: 3
  }
}

const useStyles = makeStyles(styles)

const RadioGroup = ({
  name,
  label,
  value,
  options,
  onChange,
  className,
  labelClassName,
  radioClassName
}) => {
  const classes = useStyles()

  return (
    <>
      {label && <Label1 className={classes.label}>{label}</Label1>}
      <MRadioGroup
        name={name}
        value={value}
        onChange={onChange}
        className={classnames(className)}>
        {options.map((option, idx) => (
          <FormControlLabel
            key={idx}
            value={option.code}
            control={<Radio className={radioClassName} />}
            label={option.display}
            className={classnames(labelClassName)}
          />
        ))}
      </MRadioGroup>
    </>
  )
}

export default RadioGroup
