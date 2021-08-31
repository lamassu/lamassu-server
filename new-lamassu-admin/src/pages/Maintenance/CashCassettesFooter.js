import { makeStyles } from '@material-ui/core'
// import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import React from 'react'

import { Info1, Info2, Info3 } from 'src/components/typography/index'
// import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { fromNamespace } from 'src/utils/config'

import styles from './CashCassettesFooter.styles.js'
const useStyles = makeStyles(styles)

/* const sortDate = function(a, b) {
  return new Date(b.created).getTime() - new Date(a.created).getTime()
} */

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
  const reducerFn = (
    acc,
    { cassette1, cassette2, cassette3, cassette4, id }
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

  const totalInCassettes = R.sum(R.reduce(reducerFn, [0, 0, 0, 0], machines))

  /*   const totalInCashBox = R.sum(
    R.flatten(
      R.map(id => {
        const sliceIdx = R.path([id, 0, 'cashbox'])(bills) ?? 0
        return R.map(
          R.prop('fiat'),
          R.slice(0, sliceIdx, R.sort(sortDate, bills[id] ?? []))
        )
      }, deviceIds)
    )
  ) */

  // const total = new BigNumber(totalInCassettes + totalInCashBox).toFormat(0)

  return (
    <div className={classes.footerContainer}>
      <div className={classes.footerContent}>
        <Info3 className={classes.footerLabel}>Cash value in System</Info3>
        {/*         <div className={classes.flex}>
          <TxInIcon className={classes.icon} />
          <Info2 className={classes.iconLabel}>Cash-in:</Info2>
          <Info1 className={classes.valueDisplay}>
            {totalInCashBox} {currencyCode}
          </Info1>
        </div> */}
        <div className={classes.flex}>
          <TxOutIcon className={classes.icon} />
          <Info2 className={classes.iconLabel}>Cash-out:</Info2>
          <Info1 className={classes.valueDisplay}>
            {totalInCassettes} {currencyCode}
          </Info1>
        </div>
        {/*         <div className={classes.flex}>
          <Info2 className={classes.iconLabel}>Total:</Info2>
          <Info1 className={classes.valueDisplay}>
            {total} {currencyCode}
          </Info1>
        </div> */}
      </div>
    </div>
  )
}

export default CashCassettesFooter
