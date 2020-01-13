import React, { memo } from 'react'
import { makeStyles } from '@material-ui/core/styles'

import { Label1 } from 'src/components/typography'

import { Switch } from '../base'

const styles = {
  label: {
    height: 16,
    lineHeight: '16px',
    margin: [[0, 0, 4, 0]]
  }
}

const useStyles = makeStyles(styles)

const SwitchFormik = memo(({ ...props }) => {
  const classes = useStyles()

  const { name, onChange, value } = props.field

  return (
    <>
      {props.label && <Label1 className={classes.label}>{props.label}</Label1>}
      <Switch
        name={name}
        onChange={onChange}
        value={value}
        checked={value}
        {...props}
      />
    </>
  )
})

export default SwitchFormik
