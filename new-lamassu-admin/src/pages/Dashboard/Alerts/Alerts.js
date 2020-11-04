import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import React, { useState, useEffect } from 'react'

import { Label1, H4 } from 'src/components/typography'

import styles from '../Dashboard.styles'

import AlertsTable from './AlertsTable'

const useStyles = makeStyles(styles)
const Alerts = ({ resizeSystemStatus, buttonNames, shrunk }) => {
  const classes = useStyles()
  const [showAllItems, setShowAllItems] = useState(false)

  const handleExpandTable = type => {
    switch (type) {
      case 'expand':
        setShowAllItems(true)
        resizeSystemStatus('expand')
        break
      case 'shrink':
        setShowAllItems(false)
        resizeSystemStatus('shrink')
        break
      default:
        break
    }
  }

  useEffect(() => {
    if (shrunk) {
      setShowAllItems(false)
    }
  }, [shrunk])

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <H4 className={classes.h4}>{'Alerts (6)'}</H4>
        {showAllItems && (
          <>
            <Label1 style={{ textAlign: 'center', marginBottom: 0 }}>
              <Button
                onClick={() => handleExpandTable('shrink')}
                size="small"
                disableRipple
                disableFocusRipple
                className={classes.button}>
                {buttonNames.alerts}
              </Button>
            </Label1>
          </>
        )}
      </div>

      <Grid
        container
        spacing={1}
        style={shrunk ? { display: 'none' } : { marginTop: 23 }}>
        <Grid item xs={12}>
          <AlertsTable
            handleExpandTable={handleExpandTable}
            showAllItems={showAllItems}
          />
        </Grid>
      </Grid>
    </>
  )
}
export default Alerts
