import { makeStyles } from '@material-ui/core'
import React from 'react'

import { Info1, Info2, Info3 } from 'src/components/typography/index'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'

import styles from './CashCassettesFooter.styles.js'
const useStyles = makeStyles(styles)

const CashCassettesFooter = () => {
  const classes = useStyles()

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
          <Info1 style={{ alignSelf: 'center' }}>123123123€</Info1>
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
          <Info1 style={{ alignSelf: 'center' }}>123123123€</Info1>
        </div>
        <div style={{ display: 'flex' }}>
          <Info2 style={{ alignSelf: 'center', marginRight: 8 }}>Total:</Info2>
          <Info1 style={{ alignSelf: 'center' }}>123123123€</Info1>
        </div>
      </div>
    </div>
  )
}

export default CashCassettesFooter
