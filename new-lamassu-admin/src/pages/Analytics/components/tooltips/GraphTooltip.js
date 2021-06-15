import { Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { memo } from 'react'

import { Info2, Label3, P } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { singularOrPlural } from 'src/utils/string'
import { formatDate, formatDateNonUtc } from 'src/utils/timezones'

import styles from './GraphTooltip.styles'

const useStyles = makeStyles(styles)

const formatCurrency = amount =>
  amount.toLocaleString('en-US', { maximumFractionDigits: 2 })

const GraphTooltip = ({
  coords,
  data,
  dateInterval,
  period,
  currency,
  representing
}) => {
  const classes = useStyles(coords)

  const formattedDateInterval = !R.includes('hourOfDay', representing.code)
    ? [
        formatDate(
          dateInterval[1],
          null,
          period.code === 'day' ? 'MMM D, HH:mm' : 'MMM D'
        ),
        formatDate(
          dateInterval[0],
          null,
          period.code === 'day' ? 'HH:mm' : 'MMM D'
        )
      ]
    : [
        formatDateNonUtc(dateInterval[1], 'HH:mm'),
        formatDateNonUtc(dateInterval[0], 'HH:mm')
      ]

  const transactions = R.reduce(
    (acc, value) => {
      acc.volume += parseInt(value.fiat)
      if (value.txClass === 'cashIn') acc.cashIn++
      if (value.txClass === 'cashOut') acc.cashOut++
      return acc
    },
    { volume: 0, cashIn: 0, cashOut: 0 },
    data
  )

  return (
    <Paper className={classes.dotOtWrapper}>
      <Info2 noMargin>
        {period.code === 'day' || R.includes('hourOfDay', representing.code)
          ? `${formattedDateInterval[0]} - ${formattedDateInterval[1]}`
          : `${formattedDateInterval[0]}`}
      </Info2>
      <P noMargin className={classes.dotOtTransactionAmount}>
        {R.length(data)}{' '}
        {singularOrPlural(R.length(data), 'transaction', 'transactions')}
      </P>
      <P noMargin className={classes.dotOtTransactionVolume}>
        {formatCurrency(transactions.volume)} {currency} in volume
      </P>
      <div className={classes.dotOtTransactionClasses}>
        <Label3 noMargin>
          <TxInIcon />
          <span>{transactions.cashIn} cash-in</span>
        </Label3>
        <Label3 noMargin>
          <TxOutIcon />
          <span>{transactions.cashOut} cash-out</span>
        </Label3>
      </div>
    </Paper>
  )
}

export default memo(GraphTooltip, (prev, next) => prev.coords === next.coords)
