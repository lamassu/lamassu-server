import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import { Label3, P } from 'src/components/typography'
import { formatDate } from 'src/utils/timezones'

import styles from '../Machines.styles'
const useStyles = makeStyles(styles)

const Details = ({ data, timezone }) => {
  const classes = useStyles()
  return (
    <div className={classes.row}>
      <div className={classes.rowItem}>
        <Label3 className={classes.label3}>Paired at</Label3>
        <P>
          {data.pairedAt
            ? formatDate(
                data.pairedAt,
                timezone.dstOffset,
                'YYYY-MM-DD HH:mm:ss'
              )
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
