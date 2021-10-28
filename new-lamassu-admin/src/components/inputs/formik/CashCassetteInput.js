import { makeStyles } from '@material-ui/core'
import classNames from 'classnames'
import React, { memo, useState } from 'react'

import { CashOut } from 'src/components/inputs/cashbox/Cashbox'

import { NumberInput } from '../base'
const useStyles = makeStyles({
  flex: {
    display: 'flex'
  },
  cashCassette: {
    width: 80,
    height: 36,
    marginRight: 14
  }
})

const CashCassetteInput = memo(
  ({ decimalPlaces, width, inputClassName, threshold, ...props }) => {
    const classes = useStyles()
    const { name, onChange, onBlur, value } = props.field
    const { touched, errors } = props.form
    const [notes, setNotes] = useState(value)
    const error = !!(touched[name] && errors[name])
    return (
      <div className={classes.flex}>
        <CashOut
          className={classNames(classes.cashCassette, inputClassName)}
          notes={notes}
          editingMode={true}
          width={width}
          threshold={threshold}
        />
        <NumberInput
          name={name}
          onChange={e => {
            setNotes(e.target.value)
            return onChange(e)
          }}
          onBlur={onBlur}
          value={value}
          error={error}
          decimalPlaces={decimalPlaces}
          {...props}
        />
      </div>
    )
  }
)

export default CashCassetteInput
