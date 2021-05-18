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
        autoWidth={true}
        labelId={label}
        id={name}
        value={value}
        onChange={onChange}>
        {options.map((option, index) => (
          <MenuItem key={index} value={option.value}>
            {option.display}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default Dropdown
