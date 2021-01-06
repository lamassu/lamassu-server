import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import React, { useState } from 'react'
import CollapsibleCard, { cardState } from 'src/components/CollapsibleCard'
import { H4, Label1 } from 'src/components/typography'

// import Alerts from './Alerts'
import styles from './Dashboard.styles'
import SystemStatus from './SystemStatus'

const useStyles = makeStyles(styles)

const ShrunkCard = ({ title, buttonName, onUnshrink }) => {
  const classes = useStyles()
  return (
    <div className={classes.container}>
      <H4 className={classes.h4}>{title}</H4>
      <>
        <Label1 className={classes.upperButtonLabel}>
          <Button
            onClick={onUnshrink}
            size="small"
            disableRipple
            disableFocusRipple
            className={classes.button}>
            {buttonName}
          </Button>
        </Label1>
      </>
    </div>
  )
}

const RightSide = () => {
  // const classes = useStyles()
  const [systemStatusSize, setSystemStatusSize] = useState(cardState.DEFAULT)
  // const [alertsSize, setAlertsSize] = useState(cardState.DEFAULT)

  const onReset = () => {
    // setAlertsSize(cardState.DEFAULT)
    setSystemStatusSize(cardState.DEFAULT)
  }
  return (
    <Grid item xs={6}>
      {/*         <CollapsibleCard
          className={classes.alertsCard}
          state={alertsSize}
          shrunkComponent={
            <ShrunkCard
              title={'Alerts'}
              buttonName={'Show alerts'}
              onUnshrink={onReset}
            />
          }>
          <Alerts
            onExpand={() => {
              setAlertsSize(cardState.EXPANDED)
              setSystemStatusSize(cardState.SHRUNK)
            }}
            onReset={onReset}
            size={alertsSize}
          />
        </CollapsibleCard> */}
      <CollapsibleCard
        state={systemStatusSize}
        shrunkComponent={
          <ShrunkCard
            title={'System status'}
            buttonName={'Show machines'}
            onUnshrink={onReset}
          />
        }>
        <SystemStatus
          onExpand={() => {
            setSystemStatusSize(cardState.EXPANDED)
            // setAlertsSize(cardState.SHRUNK)
          }}
          onReset={onReset}
          size={systemStatusSize}
        />
      </CollapsibleCard>
    </Grid>
  )
}

export default RightSide
