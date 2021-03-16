import { makeStyles } from '@material-ui/core'
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
    marginRight: 16
  }
})

const CashCassetteInput = memo(({ decimalPlaces, ...props }) => {
  const classes = useStyles()
  const { name, onChange, onBlur, value } = props.field
  const { touched, errors } = props.form
  const [notes, setNotes] = useState(value)
  const error = !!(touched[name] && errors[name])
  return (
    <div className={classes.flex}>
      <CashOut
        className={classes.cashCassette}
        notes={notes}
        editingMode={true}
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
})

export default CashCassetteInput
