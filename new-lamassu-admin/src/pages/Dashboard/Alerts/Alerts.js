import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import { cardState as cardState_ } from 'src/components/CollapsibleCard'
import { Label1, H4 } from 'src/components/typography'

import styles from './Alerts.styles'
import AlertsTable from './AlertsTable'

const NUM_TO_RENDER = 3

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

const Alerts = ({ onReset, onExpand, size }) => {
  const classes = useStyles()

  const showAllItems = size === cardState_.EXPANDED

  const alertsLength = () => (data ? data.alerts.length : 0)

  return (
    <>
      <div className={classes.container}>
        <H4 className={classes.h4}>{`Alerts (${alertsLength()})`}</H4>
        {showAllItems && (
          <Label1 className={classes.upperButtonLabel}>
            <Button
              onClick={onReset}
              size="small"
              disableRipple
              disableFocusRipple
              className={classes.button}>
              {'Show less'}
            </Button>
          </Label1>
        )}
      </div>
      <>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <AlertsTable
              numToRender={showAllItems ? data?.alerts.length : NUM_TO_RENDER}
              alerts={data?.alerts ?? []}
            />
            {!showAllItems && (
              <>
                <Label1 className={classes.centerLabel}>
                  <Button
                    onClick={() => onExpand('alerts')}
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
    </>
  )
}
export default Alerts
