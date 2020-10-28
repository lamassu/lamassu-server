import { makeStyles } from '@material-ui/core/styles'
import moment from 'moment'
import React from 'react'

import ActionButton from 'src/components/buttons/ActionButton'
import { Label4, P } from 'src/components/typography'
import { ReactComponent as RebootReversedIcon } from 'src/styling/icons/button/reboot/white.svg'
import { ReactComponent as RebootIcon } from 'src/styling/icons/button/reboot/zodiac.svg'
import { ReactComponent as ShutdownReversedIcon } from 'src/styling/icons/button/shut down/white.svg'
import { ReactComponent as ShutdownIcon } from 'src/styling/icons/button/shut down/zodiac.svg'
import { ReactComponent as UnpairReversedIcon } from 'src/styling/icons/button/unpair/white.svg'
import { ReactComponent as UnpairIcon } from 'src/styling/icons/button/unpair/zodiac.svg'

import styles from '../Machines.styles'
const useStyles = makeStyles(styles)
const Details = ({ data }) => {
  const classes = useStyles()
  console.log(data)
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around'
        }}>
        <div style={{ flex: 1 }}>
          <Label4 className={classes.tl2}>Paired at</Label4>
          <P>
            {data.pairedAt
              ? moment(data.pairedAt).format('YYYY-MM-DD HH:mm:ss')
              : ''}
          </P>
        </div>
        <div style={{ flex: 1 }}>
          {' '}
          <Label4 className={classes.tl2}>Machine model</Label4>
          <P>{data.model}</P>
        </div>
        <div style={{ flex: 1 }}>
          {' '}
          <Label4 className={classes.tl2}>Software version</Label4>
          <P>{data.version}</P>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around'
        }}>
        <div style={{ flex: 1 }}>
          <Label4 className={classes.tl2}>Status</Label4>
          <P>{data && data.statuses ? data.statuses[0].label : ''}</P>
        </div>
        <div style={{ flex: 1 }}>
          {' '}
          <Label4 className={classes.tl2}>Last ping</Label4>
          <P>
            {data.lastPing
              ? moment(data.lastPing).format('YYYY-MM-DD HH:mm:ss')
              : ''}
          </P>
        </div>
        <div style={{ flex: 1 }}>
          {' '}
          <Label4 className={classes.tl2}>Actions</Label4>
          {data.name && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row'
              }}>
              <ActionButton
                style={{ marginRight: 'auto' }}
                color="primary"
                className={classes.mr}
                Icon={UnpairIcon}
                InverseIcon={UnpairReversedIcon}
                disabled={() => false}
                onClick={it => console.log(it)}>
                Unpair
              </ActionButton>
              <ActionButton
                style={{ marginRight: 'auto' }}
                color="primary"
                className={classes.mr}
                Icon={RebootIcon}
                InverseIcon={RebootReversedIcon}
                disabled={() => false}
                onClick={it => console.log(it)}>
                Reboot
              </ActionButton>
              <ActionButton
                style={{ marginRight: 'auto' }}
                className={classes.inlineChip}
                color="primary"
                Icon={ShutdownIcon}
                InverseIcon={ShutdownReversedIcon}
                disabled={() => false}
                onClick={it => console.log(it)}>
                Shutdown
              </ActionButton>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Details
