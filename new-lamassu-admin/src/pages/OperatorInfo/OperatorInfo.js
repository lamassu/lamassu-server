import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import React, { useState } from 'react'

import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'

import CoinAtmRadar from './CoinATMRadar'
import ContactInfo from './ContactInfo'
import ReceiptPrinting from './ReceiptPrinting'
import TermsConditions from './TermsConditions'

const styles = {
  grid: {
    flex: 1,
    height: '100%'
  },
  content: {
    flex: 1,
    marginLeft: 48,
    paddingTop: 15
  }
}

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
      <TitleSection title="Operator information"></TitleSection>
      <Grid container className={classes.grid}>
        <Sidebar
          data={pages}
          isSelected={isSelected}
          displayName={it => it}
          onClick={it => setSelected(it)}
        />
        <div className={classes.content}>
          {isSelected(CONTACT_INFORMATION) && <ContactInfo />}
          {isSelected(RECEIPT) && <ReceiptPrinting />}
          {isSelected(TERMS_CONDITIONS) && <TermsConditions />}
          {isSelected(COIN_ATM_RADAR) && <CoinAtmRadar />}
        </div>
      </Grid>
    </>
  )
}

export default OperatorInfo
