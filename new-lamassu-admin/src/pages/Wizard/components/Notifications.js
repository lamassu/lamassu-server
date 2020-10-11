import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import React, { useState } from 'react'

import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'
import addMachineStyles from 'src/pages/AddMachine/styles'
import Notifications from 'src/pages/Notifications/Notifications'
import { namespaces } from 'src/utils/config'

import Mailgun from './Mailgun'

const styles = {
  ...addMachineStyles,
  grid: {
    flex: 1,
    height: '100%'
  },
  content: {
    marginLeft: 48,
    paddingTop: 15
  }
}

const useStyles = makeStyles(styles)

const EMAIL = 'Email'
const SETUP_CHANNELS = 'Setup channels'
const TRANSACTION_ALERTS = 'Transaction alerts'
const FIAT_BALANCE_ALERTS = 'Fiat balance alerts'
const CRYPTO_BALANCE_ALERTS = 'Crypto balance alerts'

const pages = [
  EMAIL,
  SETUP_CHANNELS,
  TRANSACTION_ALERTS,
  FIAT_BALANCE_ALERTS,
  CRYPTO_BALANCE_ALERTS
]

const N = () => {
  const [selected, setSelected] = useState(EMAIL)
  const classes = useStyles()

  const isSelected = it => selected === it

  return (
    <div className={classes.wrapper}>
      <TitleSection title="Notifications"></TitleSection>
      <Grid container className={classes.grid}>
        <Sidebar
          data={pages}
          isSelected={isSelected}
          displayName={it => it}
          onClick={it => setSelected(it)}
        />
        <div className={classes.content}>
          {isSelected(EMAIL) && <Mailgun />}
          {isSelected(SETUP_CHANNELS) && (
            <Notifications
              name={namespaces.NOTIFICATIONS}
              wizard={true}
              displayCryptoAlerts={false}
              displayOverrides={false}
              displayTitle={false}
              displayTransactionAlerts={false}
              displayFiatAlerts={false}
            />
          )}
          {isSelected(TRANSACTION_ALERTS) && (
            <Notifications
              name={namespaces.NOTIFICATIONS}
              displayCryptoAlerts={false}
              displayOverrides={false}
              displayTitle={false}
              displaySetup={false}
              displayFiatAlerts={false}
            />
          )}
          {isSelected(FIAT_BALANCE_ALERTS) && (
            <Notifications
              name={namespaces.NOTIFICATIONS}
              displayCryptoAlerts={false}
              displayOverrides={false}
              displayTitle={false}
              displayTransactionAlerts={false}
              displaySetup={false}
            />
          )}
          {isSelected(CRYPTO_BALANCE_ALERTS) && (
            <Notifications
              name={namespaces.NOTIFICATIONS}
              displaySetup={false}
              displayOverrides={false}
              displayTitle={false}
              displayTransactionAlerts={false}
              displayFiatAlerts={false}
            />
          )}
        </div>
      </Grid>
    </div>
  )
}

export default N
