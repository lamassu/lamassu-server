/*eslint-disable*/
import { makeStyles } from '@material-ui/core'
import * as R from 'ramda'
import React from 'react'
import BigNumber from "bignumber.js"
import { Info1, Info2, Info3 } from 'src/components/typography/index'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { fromNamespace } from 'src/utils/config'

import styles from './CashCassettesFooter.styles.js'
const useStyles = makeStyles(styles)

const sortDate = function(a, b) { return new Date(b.created).getTime() - new Date(a.created).getTime()}

const CashCassettesFooter = ({ machines, config, currencyCode, bills, deviceIds }) => {
  const classes = useStyles()
  const cashout = config && fromNamespace('cashOut')(config)
  const getCashoutSettings = id => fromNamespace(id)(cashout)
  const reducerFn = (acc, { cassette1, cassette2, id }) => [
    (acc[0] += cassette1 * getCashoutSettings(id).top),
    (acc[1] += cassette2 * getCashoutSettings(id).bottom)
  ]
  const totalInCassettes = R.sum(R.reduce(reducerFn, [0,0], machines))
  const totalInCashBox = R.sum(R.flatten(R.map(id => {
    const sliceIdx = R.path([id, 0, 'cashbox'])(bills) ?? 0
    return R.map(R.prop('fiat'), R.slice(0, sliceIdx, R.sort(sortDate, bills[id] ?? [])))
  }, deviceIds)))
  const total = new BigNumber(totalInCassettes + totalInCashBox).toFormat(0)


  return (
    <div className={classes.footerContainer}>
      <div className={classes.footerContent}>
        <Info3 className={classes.footerLabel}>Cash value in System</Info3>
        <div style={{ display: 'flex' }}>
          <TxInIcon
            style={{
              alignSelf: 'center',
              height: 20,
              width: 20,
              marginRight: 8
            }}
          />
          <Info2 style={{ alignSelf: 'center', marginRight: 8 }}>
            Cash-in:
          </Info2>
          <Info1 style={{ alignSelf: 'center' }}>{totalInCashBox} {currencyCode}</Info1>
        </div>
        <div style={{ display: 'flex' }}>
          <TxOutIcon
            style={{
              alignSelf: 'center',
              height: 20,
              width: 20,
              marginRight: 8
            }}
          />
          <Info2 style={{ alignSelf: 'center', marginRight: 8 }}>
            Cash-out:
          </Info2>
          <Info1 style={{ alignSelf: 'center' }}>{totalInCassettes} {currencyCode}</Info1>
        </div>
        <div style={{ display: 'flex' }}>
          <Info2 style={{ alignSelf: 'center', marginRight: 8 }}>Total:</Info2>
          <Info1 style={{ alignSelf: 'center' }}>{total} {currencyCode}</Info1>
        </div>
      </div>
    </div>
  )
}

export default CashCassettesFooter
