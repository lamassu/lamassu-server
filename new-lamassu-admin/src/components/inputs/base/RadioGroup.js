import {
  Radio as MaterialRadio,
  RadioGroup as MaterialRadioGroup,
  FormControlLabel
} from '@material-ui/core'
import { withStyles } from '@material-ui/styles'
import classnames from 'classnames'
import React from 'react'

import { secondaryColor } from '../../../styling/variables'
import typographyStyles from '../../typography/styles'

const { p } = typographyStyles

const GreenRadio = withStyles({
  root: {
    color: secondaryColor,
    '&$checked': {
      color: secondaryColor
    }
  },
  checked: {}
})(props => <MaterialRadio color="default" {...props} />)

const Label = withStyles({
  label: {
    extend: p
  }
})(props => <FormControlLabel {...props} />)

/* options = [{ label, value }]
 */
const RadioGroup = ({
  name,
  value,
  options,
  ariaLabel,
  onChange,
  className,
  ...props
}) => {
  return (
    <>
      {options && (
        <MaterialRadioGroup
          aria-label={ariaLabel}
          name={name}
          value={value}
          onChange={onChange}
          className={classnames(className)}>
          {options.map((option, idx) => (
            <Label
              key={idx}
              value={option.display}
              control={<GreenRadio />}
              label={option.display}
            />
          ))}
        </MaterialRadioGroup>
      )}
    </>
  )
}

export default RadioGroup
