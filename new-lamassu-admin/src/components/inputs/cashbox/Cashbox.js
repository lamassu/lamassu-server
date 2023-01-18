import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import * as R from 'ramda'
import React from 'react'

import Chip from 'src/components/Chip'
import { Info2, Label1, Label2 } from 'src/components/typography'
import { numberToFiatAmount } from 'src/utils/number'

import { cashboxStyles, gridStyles } from './Cashbox.styles'

const cashboxClasses = makeStyles(cashboxStyles)
const gridClasses = makeStyles(gridStyles)

const Cashbox = ({
  applyColorVariant,
  applyFiatBalanceAlertsStyling,
  capacity = 0,
  cashOut = false,
  className,
  emptyPartClassName,
  labelClassName,
  notes = 0,
  omitInnerPercentage,
  percent,
  threshold = 50,
  width
}) => {
  percent = R.isNil(percent)
    ? R.clamp(0, 100)(Math.round((notes / capacity) * 100))
    : percent
  const isLow = percent < threshold
  const ltHalf = percent <= 51

  const classes = cashboxClasses({
    percent,
    cashOut,
    width,
    applyColorVariant,
    isLow
  })

  const showCashBox = {
    [classes.fiatBalanceAlertCashbox]: applyFiatBalanceAlertsStyling,
    [classes.cashbox]: !applyFiatBalanceAlertsStyling
  }

  return (
    <div className={classnames(className, showCashBox)}>
      <div className={classnames(emptyPartClassName, classes.emptyPart)}>
        {!omitInnerPercentage && ltHalf && (
          <Label2 className={labelClassName}>{percent}%</Label2>
        )}
      </div>
      <div className={classes.fullPart}>
        {!omitInnerPercentage && !ltHalf && (
          <Label2 className={labelClassName}>{percent}%</Label2>
        )}
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
        <div>
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

const CashOut = ({
  capacity = 500,
  denomination = 0,
  currency,
  notes,
  className,
  editingMode = false,
  threshold,
  width
}) => {
  const classes = gridClasses()
  return (
    <>
      <div className={classes.row}>
        <div className={classes.col}>
          <Cashbox
            className={className}
            notes={notes}
            capacity={capacity}
            threshold={threshold}
            cashOut
            width={width}
          />
        </div>
        {!editingMode && (
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
                {numberToFiatAmount(notes * denomination)} {currency.code}
              </Label1>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export { Cashbox, CashIn, CashOut }
