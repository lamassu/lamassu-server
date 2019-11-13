import React from 'react'
import classnames from 'classnames'
import { withStyles } from '@material-ui/styles'
import {
  Radio as MaterialRadio,
  RadioGroup as MaterialRadioGroup,
  FormControlLabel
} from '@material-ui/core'

import typographyStyles from '../../typography/styles'
import { secondaryColor } from '../../../styling/variables'

const { p } = typographyStyles

const GreenRadio = withStyles({
  root: {
    color: secondaryColor,
    '&$checked': {
      color: secondaryColor
    }
  },
  checked: {}
})(props => <MaterialRadio color='default' {...props} />)

const Label = withStyles({
  label: {
    extend: p
  }
})(props => <FormControlLabel {...props} />)

const RadioGroup = ({ name, value, labels, ariaLabel, onChange, className, ...props }) => {
  return (
    <>
      {labels && (
        <MaterialRadioGroup aria-label={ariaLabel} name={name} value={value} onChange={onChange} className={classnames(className)}>
          {labels.map((label, idx) => (
            <Label key={idx} value={idx} control={<GreenRadio />} label={label} />
          ))}
        </MaterialRadioGroup>
      )}
    </>
  )
}

export default RadioGroup
