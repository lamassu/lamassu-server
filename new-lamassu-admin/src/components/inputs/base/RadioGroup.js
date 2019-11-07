import React from 'react'
import classnames from 'classnames'
import { withStyles } from '@material-ui/styles'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { Radio as MaterialRadio, RadioGroup as MaterialRadioGroup } from '@material-ui/core'
import { secondaryColor } from '../../../styling/variables'

const GreenRadio = withStyles({
  root: {
    color: secondaryColor,
    '&$checked': {
      color: secondaryColor
    }
  },
  checked: {}
})(props => <MaterialRadio color='default' {...props} />)

const RadioGroup = ({ name, value, labels, ariaLabel, onChange, className, ...props }) => {
  return (
    <>
      {labels && (
        <MaterialRadioGroup aria-label={ariaLabel} name={name} value={value} onChange={onChange} className={classnames(className)}>
          {labels.map((label, idx) => (
            <FormControlLabel key={idx} value={idx} control={<GreenRadio />} label={label} />
          ))}
        </MaterialRadioGroup>
      )}
    </>
  )
}

export default RadioGroup
