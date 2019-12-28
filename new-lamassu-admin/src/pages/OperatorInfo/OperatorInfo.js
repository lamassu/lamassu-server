import React, { useState } from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core'

import Sidebar from 'src/components/Sidebar'
import Title from 'src/components/Title'

import logsStyles from '../Logs.styles'

import CoinAtmRadar from './CoinATMRadar'
import ContactInfo from './ContactInfo'

const localStyles = {
  contentWrapper: {
    marginLeft: 48,
    paddingTop: 15
  }
}

const styles = R.merge(logsStyles, localStyles)

const useStyles = makeStyles(styles)

const CONTACT_INFORMATION = 'Contact information'
const RECEIPT = 'Receipt'
const COIN_ATM_RADAR = 'Coin ATM Radar'
const TERMS_CONDITIONS = 'Terms & Conditions'

const pages = [CONTACT_INFORMATION, RECEIPT, COIN_ATM_RADAR, TERMS_CONDITIONS]

const OperatorInfo = () => {
  const [selected, setSelected] = useState(CONTACT_INFORMATION)
  const classes = useStyles()

  const isSelected = it => selected === it

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Operator information</Title>
        </div>
      </div>
      <div className={classes.wrapper}>
        <Sidebar
          data={pages}
          isSelected={isSelected}
          displayName={it => it}
          onClick={it => setSelected(it)}
        />
        <div className={classes.contentWrapper}>
          {isSelected(CONTACT_INFORMATION) && <ContactInfo />}
          {isSelected(COIN_ATM_RADAR) && <CoinAtmRadar />}
        </div>
      </div>
    </>
  )
}

export default OperatorInfo
