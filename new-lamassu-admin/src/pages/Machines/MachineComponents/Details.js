import { makeStyles } from '@material-ui/core/styles'
import moment from 'moment'
import React from 'react'

import { Label3, P } from 'src/components/typography'

import styles from '../Machines.styles'
const useStyles = makeStyles(styles)

const Details = ({ data }) => {
  const classes = useStyles()
  return (
    <div className={classes.row}>
      <div className={classes.rowItem}>
        <Label3 className={classes.label3}>Paired at</Label3>
        <P>
          {data.pairedAt
            ? moment(data.pairedAt).format('YYYY-MM-DD HH:mm:ss')
            : ''}
        </P>
      </div>
      <div className={classes.rowItem}>
        <Label3 className={classes.label3}>Machine model</Label3>
        <P>{data.model}</P>
      </div>
      <div className={classes.rowItem}>
        <Label3 className={classes.label3}>Software version</Label3>
        <P>{data.version}</P>
      </div>
    </div>
  )
}

export default Details
