import { makeStyles } from '@material-ui/core'
import * as R from 'ramda'
import React, { useState } from 'react'

import Title from 'src/components/Title'
import Sidebar from 'src/components/layout/Sidebar'

import logsStyles from '../Logs.styles'

import CoinAtmRadar from './CoinATMRadar'
import ContactInfo from './ContactInfo'
import TermsConditions from './TermsConditions'

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
          {isSelected(TERMS_CONDITIONS) && <TermsConditions />}
          {isSelected(COIN_ATM_RADAR) && <CoinAtmRadar />}
        </div>
      </div>
    </>
  )
}

export default OperatorInfo
