import { makeStyles } from '@material-ui/core'
import { Field, useFormikContext } from 'formik'
import * as R from 'ramda'
import React from 'react'

import NumberInput from 'src/components/inputs/formik/NumberInput'
import RadioGroup from 'src/components/inputs/formik/RadioGroup'
import { TL1 } from 'src/components/typography'

const styles = {
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 28
  },
  flex: {
    display: 'flex'
  },
  tl1: {
    marginLeft: 8,
    marginTop: 25
  }
}

const useStyles = makeStyles(styles)
const options = [
  { display: 'None', code: 'none' },
  { display: 'Date', code: 'date' },
  { display: 'Length', code: 'length' }
]

const NumericalEntry = () => {
  const classes = useStyles()
  const isLength =
    (R.path(['values', 'numericalConstraintType'])(useFormikContext()) ??
      null) === 'length'
  return (
    <>
      <Field
        className={classes.row}
        component={RadioGroup}
        options={options}
        name="numericalConstraintType"
      />
      {isLength && (
        <div className={classes.flex}>
          <Field
            component={NumberInput}
            name={'numberInputLength'}
            label={'Length'}
            style={{ maxWidth: 56 }}
            decimalPlaces={0}
            allowNegative={false}
          />
          <TL1 className={classes.tl1}>digits</TL1>
        </div>
      )}
    </>
  )
}

export default NumericalEntry
