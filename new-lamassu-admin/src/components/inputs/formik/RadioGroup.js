import React, { memo } from 'react'
import { makeStyles } from '@material-ui/core'

import { Label1 } from 'src/components/typography'

import { RadioGroup } from '../base'

const styles = {
  label: {
    height: 16,
    lineHeight: '16px',
    margin: [[0, 0, 4, 0]],
    paddingLeft: 3
  }
}

const useStyles = makeStyles(styles)

const RadioGroupFormik = memo(({ ...props }) => {
  const classes = useStyles()

  const { name, onChange, value } = props.field

  return (
    <>
      {props.label && <Label1 className={classes.label}>{props.label}</Label1>}
      <RadioGroup
        name={name}
        value={value}
        options={props.options}
        ariaLabel={name}
        onChange={e => {
          onChange(e)
          props.resetError()
        }}
        className={props.className}
        {...props}
      />
    </>
  )
})

export default RadioGroupFormik
