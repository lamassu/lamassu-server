import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { useFormikContext, Field as FormikField } from 'formik'
import React from 'react'

import { NumberInput } from 'src/components/inputs/formik'
import { Label1, Info1, TL2 } from 'src/components/typography'

import styles from './EditableNumber.styles'

const useStyles = makeStyles(styles)

const EditableNumber = ({
  label,
  name,
  editing,
  displayValue,
  decoration,
  className,
  decimalPlaces = 0,
  width = 80
}) => {
  const classes = useStyles({ width, editing })
  const { values } = useFormikContext()

  const classNames = {
    [classes.fieldWrapper]: true,
    className
  }

  return (
    <div className={classnames(classNames)}>
      {label && <Label1 className={classes.label}>{label}</Label1>}
      <div className={classes.valueWrapper}>
        {!editing && (
          <Info1 className={classes.text}>{displayValue(values[name])}</Info1>
        )}
        {editing && (
          <FormikField
            id={name}
            size="lg"
            fullWidth
            name={name}
            component={NumberInput}
            textAlign="right"
            width={width}
            decimalPlaces={decimalPlaces}
          />
        )}
        <TL2 className={classes.decoration}>{decoration}</TL2>
      </div>
    </div>
  )
}

export default EditableNumber
