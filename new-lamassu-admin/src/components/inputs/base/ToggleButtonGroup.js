import { ToggleButtonGroup as MUIToggleButtonGroup } from '@material-ui/lab'
import React from 'react'

const ToggleButtonGroup = ({
  name,
  orientation = 'vertical',
  value,
  exclusive = true,
  onChange,
  ...props
}) => {
  return (
    <MUIToggleButtonGroup
      name={name}
      orientation={orientation}
      value={value}
      exclusive={exclusive}
      onChange={onChange}>
      {props.children}
    </MUIToggleButtonGroup>
  )
}

export default ToggleButtonGroup
