import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { Field, useFormikContext } from 'formik'
import * as R from 'ramda'
import React from 'react'

import NumberInput from 'src/components/inputs/formik/NumberInput'
import RadioGroup from 'src/components/inputs/formik/RadioGroup'
import { TL1, H4 } from 'src/components/typography'

import styles from './formStyles.styles'
const useStyles = makeStyles(styles)

const options = [
  { display: 'None', code: 'none' },
  { display: 'Date', code: 'date' },
  { display: 'Length', code: 'length' }
]

const NumericalEntry = () => {
  const classes = useStyles()
  const context = useFormikContext()

  const isLength =
    (R.path(['values', 'constraintType'])(useFormikContext()) ?? null) ===
    'length'

  const showErrorColor = {
    [classes.radioSubtitle]: true,
    [classes.error]:
      !R.path(['values', 'constraintType'])(context) &&
      R.path(['errors', 'constraintType'])(context)
  }

  return (
    <>
      <H4 className={classnames(showErrorColor)}>
        Numerical entry constraints
      </H4>
      <Field
        className={classes.row}
        component={RadioGroup}
        options={options}
        name="constraintType"
      />
      {isLength && (
        <div className={classnames(classes.flex, classes.numberField)}>
          <Field
            component={NumberInput}
            name={'inputLength'}
            label={'Length'}
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
