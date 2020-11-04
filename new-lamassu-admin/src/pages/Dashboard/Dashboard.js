import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import React, { useState } from 'react'

import TitleSection from 'src/components/layout/TitleSection'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'

import Alerts from './Alerts'
import styles from './Dashboard.styles'
import Footer from './Footer'
import SystemPerformance from './SystemPerformance'
import SystemStatus from './SystemStatus'

const useStyles = makeStyles(styles)

const Dashboard = () => {
  const classes = useStyles()

  const [buttonNames, setButtonNames] = useState({
    alerts: 'Show less',
    systemStatus: 'Show less'
  })
  const [shrunk, setShrunk] = useState({ alerts: false, systemStatus: false })

  const resizeAlerts = type => {
    switch (type) {
      case 'expand':
        setButtonNames({ alerts: 'Show less', systemStatus: 'Show less' })
        setShrunk({ ...shrunk, alerts: false })
        break
      case 'shrink':
        setButtonNames({ alerts: 'Show alerts', systemStatus: 'Show less' })
        setShrunk({ ...shrunk, alerts: true })
        break
      default:
        break
    }
  }

  const resizeSystemStatus = type => {
    switch (type) {
      case 'expand':
        setButtonNames({ alerts: 'Show less', systemStatus: 'Show machines' })
        setShrunk({ ...shrunk, systemStatus: true })
        break
      case 'shrink':
        setButtonNames({ alerts: 'Show less', systemStatus: 'Show less' })
        setShrunk({ ...shrunk, systemStatus: false })
        break
      default:
        break
    }
  }

  return (
    <>
      <TitleSection title="Dashboard">
        <div className={classes.headerLabels}>
          <div>
            <TxOutIcon />
            <span>Cash-out</span>
          </div>
          <div>
            <TxInIcon />
            <span>Cash-in</span>
          </div>
        </div>
      </TitleSection>
      <div className={classes.root}>
        <Grid container>
          <Grid item xs={6}>
            <Grid item style={{ marginRight: 24 }}>
              <div className={classes.card}>
                <SystemPerformance />
              </div>
            </Grid>
          </Grid>
          <Grid item xs={6}>
            <Grid item style={{ marginBottom: 16 }}>
              <div className={classes.card}>
                <Alerts
                  shrunk={shrunk.alerts}
                  buttonNames={buttonNames}
                  resizeSystemStatus={resizeSystemStatus}
                />
              </div>
            </Grid>
            <Grid item>
              <div className={classes.card}>
                <SystemStatus
                  shrunk={shrunk.systemStatus}
                  buttonNames={buttonNames}
                  resizeAlerts={resizeAlerts}
                />
              </div>
            </Grid>
          </Grid>
        </Grid>
      </div>
      <Footer />
    </>
  )
}

export default Dashboard
