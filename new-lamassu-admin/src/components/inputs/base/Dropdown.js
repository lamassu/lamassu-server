import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import classnames from 'classnames'
import React from 'react'
const Dropdown = ({ label, name, options, onChange, value, className }) => {
  return (
    <FormControl className={classnames(className)}>
      <InputLabel>{label}</InputLabel>
      <Select
        // displayEmpty
        autoWidth={true}
        labelId={label}
        id={name}
        value={value}
        onChange={onChange}>
        {/*         <MenuItem key={'-1'} value={''}>
          <em>{label}</em>
        </MenuItem> */}
        {options.map((option, index) => {
          return (
            <MenuItem key={index} value={option.value}>
              {option.display}
            </MenuItem>
          )
        })}
      </Select>
    </FormControl>
  )
}

export default Dropdown
