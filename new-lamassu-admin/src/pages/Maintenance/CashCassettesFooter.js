import { makeStyles } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import React from 'react'

import { Info1, Info2, Info3 } from 'src/components/typography/index'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { fromNamespace } from 'src/utils/config'
import { numberToFiatAmount } from 'src/utils/number.js'

import styles from './CashCassettesFooter.styles.js'
const useStyles = makeStyles(styles)

const CashCassettesFooter = ({
  machines,
  config,
  currencyCode,
  bills,
  deviceIds
}) => {
  const classes = useStyles()
  const cashout = config && fromNamespace('cashOut')(config)
  const getCashoutSettings = id => fromNamespace(id)(cashout)
  const cashoutReducerFn = (
    acc,
    { cashUnits: { cassette1, cassette2, cassette3, cassette4 }, id }
  ) => {
    const cassette1Denomination = getCashoutSettings(id).cassette1 ?? 0
    const cassette2Denomination = getCashoutSettings(id).cassette2 ?? 0
    const cassette3Denomination = getCashoutSettings(id).cassette3 ?? 0
    const cassette4Denomination = getCashoutSettings(id).cassette4 ?? 0
    return [
      (acc[0] += cassette1 * cassette1Denomination),
      (acc[1] += cassette2 * cassette2Denomination),
      (acc[2] += cassette3 * cassette3Denomination),
      (acc[3] += cassette4 * cassette4Denomination)
    ]
  }

  const recyclerReducerFn = (
    acc,
    {
      cashUnits: {
        stacker1f,
        stacker1r,
        stacker2f,
        stacker2r,
        stacker3f,
        stacker3r
      },
      id
    }
  ) => {
    const stacker1fDenomination = getCashoutSettings(id).stacker1f ?? 0
    const stacker1rDenomination = getCashoutSettings(id).stacker1r ?? 0
    const stacker2fDenomination = getCashoutSettings(id).stacker2f ?? 0
    const stacker2rDenomination = getCashoutSettings(id).stacker2r ?? 0
    const stacker3fDenomination = getCashoutSettings(id).stacker3f ?? 0
    const stacker3rDenomination = getCashoutSettings(id).stacker3r ?? 0
    return [
      (acc[0] += stacker1f * stacker1fDenomination),
      (acc[1] += stacker1r * stacker1rDenomination),
      (acc[0] += stacker2f * stacker2fDenomination),
      (acc[1] += stacker2r * stacker2rDenomination),
      (acc[0] += stacker3f * stacker3fDenomination),
      (acc[1] += stacker3r * stacker3rDenomination)
    ]
  }

  const totalInRecyclers = R.sum(
    R.reduce(recyclerReducerFn, [0, 0, 0, 0, 0, 0], machines)
  )

  const totalInCassettes = R.sum(
    R.reduce(cashoutReducerFn, [0, 0, 0, 0], machines)
  )

  const totalInCashBox = R.sum(R.map(it => it.fiat)(bills))

  const total = new BigNumber(
    totalInCassettes + totalInCashBox + totalInRecyclers
  ).toFormat(0)

  return (
    <div className={classes.footerContainer}>
      <div className={classes.footerContent}>
        <Info3 className={classes.footerLabel}>Cash value in System</Info3>
        <div className={classes.flex}>
          <TxInIcon className={classes.icon} />
          <Info2 className={classes.iconLabel}>Cash-in:</Info2>
          <Info1 className={classes.valueDisplay}>
            {numberToFiatAmount(totalInCashBox)} {currencyCode}
          </Info1>
        </div>
        <div className={classes.flex}>
          <TxOutIcon className={classes.icon} />
          <Info2 className={classes.iconLabel}>Cash-out:</Info2>
          <Info1 className={classes.valueDisplay}>
            {numberToFiatAmount(totalInCassettes)} {currencyCode}
          </Info1>
        </div>
        <div className={classes.flex}>
          <TxOutIcon className={classes.icon} />
          <Info2 className={classes.iconLabel}>Recycle:</Info2>
          <Info1 className={classes.valueDisplay}>
            {numberToFiatAmount(totalInRecyclers)} {currencyCode}
          </Info1>
        </div>
        <div className={classes.flex}>
          <Info2 className={classes.iconLabel}>Total:</Info2>
          <Info1 className={classes.valueDisplay}>
            {numberToFiatAmount(total)} {currencyCode}
          </Info1>
        </div>
      </div>
    </div>
  )
}

export default CashCassettesFooter
