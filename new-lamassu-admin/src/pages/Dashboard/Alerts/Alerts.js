import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import { H4, Label1 } from 'src/components/typography'

import styles from '../Dashboard.styles'

const useStyles = makeStyles(styles)
const Alerts = () => {
  const classes = useStyles()

  return (
    <>
      <H4 className={classes.h4}>{'Alerts (6)'}</H4>
      <ul>
        <li>Important Alert #1</li>
        <li>Important Alert #2</li>
        <li>Important Alert #3</li>
        <li>Important Alert #4</li>
      </ul>

      <Label1 style={{ textAlign: 'center', marginBottom: 0 }}>
        <Button
          size="small"
          disableRipple
          disableFocusRipple
          className={classes.label}>
          Show all (6)
        </Button>
      </Label1>
    </>
  )
}
export default Alerts
