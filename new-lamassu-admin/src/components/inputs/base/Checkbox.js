import Checkbox from '@material-ui/core/Checkbox'
import { makeStyles } from '@material-ui/core/styles'
import CheckBoxIcon from '@material-ui/icons/CheckBox'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import React from 'react'

import { secondaryColor } from '../../../styling/variables'

const useStyles = makeStyles({
  root: {
    color: secondaryColor,
    '&$checked': {
      color: secondaryColor,
    },
  },
  checked: {},
})

const CheckboxInput = ({ name, onChange, value, label, ...props }) => {
  const classes = useStyles()

  // const { name, onChange, value } = props.field

  return (
    <Checkbox
      id={name}
      classes={{
        root: classes.root,
        checked: classes.checked,
      }}
      onChange={onChange}
      value={value}
      checked={value}
      icon={
        <CheckBoxOutlineBlankIcon style={{ marginLeft: 2, fontSize: 16 }} />
      }
      checkedIcon={<CheckBoxIcon style={{ fontSize: 20 }} />}
      disableRipple
      {...props}
    />
  )
}

export default CheckboxInput
