import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React from 'react'

import Chip from 'src/components/Chip'
import { Link } from 'src/components/buttons'
import { Info2, Label1, Label2 } from 'src/components/typography'

import TextInputFormik from '../base/TextInput'

import { cashboxStyles, gridStyles } from './Cashbox.styles'

const cashboxClasses = makeStyles(cashboxStyles)
const gridClasses = makeStyles(gridStyles)

const Cashbox = ({
  percent = 0,
  cashOut = false,
  className,
  emptyPartClassName
}) => {
  const classes = cashboxClasses({ percent, cashOut })
  const threshold = 51

  return (
    <div className={classnames(className, classes.cashbox)}>
      <div className={classnames(emptyPartClassName, classes.emptyPart)}>
        {percent <= threshold && <Label2>{percent.toFixed(0)}%</Label2>}
      </div>
      <div className={classes.fullPart}>
        {percent > threshold && <Label2>{percent.toFixed(0)}%</Label2>}
      </div>
    </div>
  )
}

// https://support.lamassu.is/hc/en-us/articles/360025595552-Installing-the-Sintra-Forte
// Sintra and Sintra Forte can have up to 500 notes per cashOut box and up to 1000 per cashIn box
const CashIn = ({ currency, notes, total }) => {
  const classes = gridClasses()
  return (
    <>
      <div className={classes.row}>
        <div className={classes.col2}>
          <div className={classes.innerRow}>
            <Info2 className={classes.noMarginText}>{notes} notes</Info2>
          </div>
          <div className={classes.innerRow}>
            <Label1 className={classes.noMarginText}>
              {total} {currency.code}
            </Label1>
          </div>
        </div>
      </div>
    </>
  )
}

const CashInFormik = ({
  capacity = 1000,
  onEmpty,
  field: {
    value: { notes, deviceId }
  },
  form: { setFieldValue }
}) => {
  const classes = gridClasses()

  return (
    <>
      <div className={classes.row}>
        <div>
          <Cashbox percent={(100 * notes) / capacity} />
        </div>
        <div className={classes.col2}>
          <div>
            <Link
              onClick={() => {
                onEmpty({
                  variables: {
                    deviceId,
                    action: 'emptyCashInBills'
                  }
                }).then(() => setFieldValue('cashin.notes', 0))
              }}
              className={classes.link}
              color={'primary'}>
              Empty
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

const CashOut = ({
  capacity = 500,
  denomination = 0,
  currency,
  notes,
  className
}) => {
  const percent = (100 * notes) / capacity
  const classes = gridClasses()
  return (
    <>
      <div className={classes.row}>
        <div className={classes.col}>
          <Cashbox className={className} percent={percent} cashOut />
        </div>
        <div className={classes.col2}>
          <div className={classes.innerRow}>
            <Info2 className={classes.noMarginText}>{notes}</Info2>
            <Chip
              className={classes.chip}
              label={`${denomination} ${currency.code}`}
            />
          </div>
          <div className={classes.innerRow}>
            <Label1 className={classes.noMarginText}>
              {notes * denomination} {currency.code}
            </Label1>
          </div>
        </div>
      </div>
    </>
  )
}

const CashOutFormik = ({ capacity = 500, ...props }) => {
  const {
    name,
    onChange,
    onBlur,
    value: { notes }
  } = props.field
  const { touched, errors } = props.form

  const error = !!(touched[name] && errors[name])

  const percent = (100 * notes) / capacity
  const classes = gridClasses()

  return (
    <>
      <div className={classes.row}>
        <div className={classes.col}>
          <Cashbox percent={percent} cashOut />
        </div>
        <div className={(classes.col, classes.col2)}>
          <div>
            <TextInputFormik
              fullWidth
              name={name + '.notes'}
              onChange={onChange}
              onBlur={onBlur}
              value={notes}
              error={error}
              {...props}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export { Cashbox, CashIn, CashInFormik, CashOut, CashOutFormik }
