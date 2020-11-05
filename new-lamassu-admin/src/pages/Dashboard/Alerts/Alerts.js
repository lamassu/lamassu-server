import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import React, { useState, useEffect } from 'react'

import { Label1, H4 } from 'src/components/typography'

import styles from '../Dashboard.styles'

import AlertsTable from './AlertsTable'

const NUM_TO_RENDER = 1

const data = {
  alerts: [
    { text: 'alert 1' },
    { text: 'alert 2' },
    { text: 'alert 3' },
    { text: 'alert 4' },
    { text: 'alert 5' }
  ]
}

const useStyles = makeStyles(styles)

const Alerts = ({ cardState, setRightSideState }) => {
  const classes = useStyles()
  const [showAllItems, setShowAllItems] = useState(false)
  const [showExpandButton, setShowExpandButton] = useState(false)
  const [numToRender, setNumToRender] = useState(NUM_TO_RENDER)

  useEffect(() => {
    if (showAllItems) {
      setShowExpandButton(false)
    } else if (data && data?.alerts.length > numToRender) {
      setShowExpandButton(true)
    }
    if (cardState.cardSize === 'small' || cardState.cardSize === 'default') {
      setShowAllItems(false)
      setNumToRender(NUM_TO_RENDER)
    }
  }, [cardState.cardSize, numToRender, showAllItems])

  const reset = () => {
    setShowAllItems(false)
    setNumToRender(NUM_TO_RENDER)
    setRightSideState({
      systemStatus: { cardSize: 'default', buttonName: 'Show less' },
      alerts: { cardSize: 'default', buttonName: 'Show less' }
    })
  }

  const showAllClick = () => {
    setShowExpandButton(false)
    setShowAllItems(true)
    setRightSideState({
      systemStatus: { cardSize: 'small', buttonName: 'Show machines' },
      alerts: { cardSize: 'big', buttonName: 'Show less' }
    })
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <H4>{'Alerts (6)'}</H4>
        {(showAllItems || cardState.cardSize === 'small') && (
          <>
            <Label1 style={{ textAlign: 'center', marginBottom: 0 }}>
              <Button
                onClick={reset}
                size="small"
                disableRipple
                disableFocusRipple
                className={classes.button}>
                {cardState.buttonName}
              </Button>
            </Label1>
          </>
        )}
      </div>
      {cardState.cardSize !== 'small' && (
        <>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <AlertsTable
                numToRender={numToRender}
                alerts={data?.alerts ?? []}
              />
              {showExpandButton && (
                <>
                  <Label1 style={{ textAlign: 'center', marginBottom: 0 }}>
                    <Button
                      onClick={showAllClick}
                      size="small"
                      disableRipple
                      disableFocusRipple
                      className={classes.button}>
                      {`Show all (${data.alerts.length})`}
                    </Button>
                  </Label1>
                </>
              )}
            </Grid>
          </Grid>
        </>
      )}
    </>
  )
}
export default Alerts
