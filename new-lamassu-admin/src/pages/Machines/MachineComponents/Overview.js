import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import moment from 'moment'
import React, { useState } from 'react'

import { ConfirmDialog } from 'src/components/ConfirmDialog'
import { Status } from 'src/components/Status'
import ActionButton from 'src/components/buttons/ActionButton'
import { H3, Label3, P } from 'src/components/typography'
import { ReactComponent as RebootReversedIcon } from 'src/styling/icons/button/reboot/white.svg'
import { ReactComponent as RebootIcon } from 'src/styling/icons/button/reboot/zodiac.svg'
import { ReactComponent as ShutdownReversedIcon } from 'src/styling/icons/button/shut down/white.svg'
import { ReactComponent as ShutdownIcon } from 'src/styling/icons/button/shut down/zodiac.svg'
import { ReactComponent as UnpairReversedIcon } from 'src/styling/icons/button/unpair/white.svg'
import { ReactComponent as UnpairIcon } from 'src/styling/icons/button/unpair/zodiac.svg'

import styles from '../Machines.styles'
const useStyles = makeStyles(styles)

const MACHINE_ACTION = gql`
  mutation MachineAction(
    $deviceId: ID!
    $action: MachineAction!
    $newName: String
  ) {
    machineAction(deviceId: $deviceId, action: $action, newName: $newName) {
      deviceId
    }
  }
`

const Overview = ({ data, onActionSuccess }) => {
  const [action, setAction] = useState('')
  const [confirmActionDialogOpen, setConfirmActionDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const classes = useStyles()

  const [machineAction] = useMutation(MACHINE_ACTION, {
    onError: ({ message }) => {
      const errorMessage = message ?? 'An error ocurred'
      setErrorMessage(errorMessage)
    },
    onCompleted: () => {
      onActionSuccess && onActionSuccess()
      setConfirmActionDialogOpen(false)
    }
  })

  const confirmActionDialog = action =>
    setAction(action) || setConfirmActionDialogOpen(true)

  const makeLastPing = () => {
    const now = moment()
    const secondsAgo = now.diff(data.lastPing, 'seconds')
    if (secondsAgo < 60) {
      return `${secondsAgo} ${secondsAgo === 1 ? 'second' : 'seconds'} ago`
    }
    if (secondsAgo < 3600) {
      const minutes = Math.round(secondsAgo / 60)
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    }
    if (secondsAgo < 3600 * 24) {
      const hours = Math.round(secondsAgo / 3600)
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    }
    const days = Math.round(secondsAgo / 3600 / 24)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  }

  return (
    <>
      <div className={classes.row}>
        <div className={classes.rowItem}>
          <H3>{data.name}</H3>
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.rowItem}>
          <Label3 className={classes.label3}>Status</Label3>
          {data && data.statuses ? <Status status={data.statuses[0]} /> : null}
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.rowItem}>
          <Label3 className={classes.label3}>Last ping</Label3>
          <P>{data.lastPing ? makeLastPing() : ''}</P>
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.rowItem}>
          {' '}
          <Label3 className={classes.label3}>Actions</Label3>
          {data.name && (
            <div className={classes.actionButtonsContainer}>
              <ActionButton
                color="primary"
                className={classes.actionButton}
                Icon={UnpairIcon}
                InverseIcon={UnpairReversedIcon}
                onClick={() => confirmActionDialog('Unpair')}>
                Unpair
              </ActionButton>
              <ActionButton
                color="primary"
                className={classes.actionButton}
                Icon={RebootIcon}
                InverseIcon={RebootReversedIcon}
                onClick={() => confirmActionDialog('Reboot')}>
                Reboot
              </ActionButton>
              <ActionButton
                className={classes.actionButton}
                color="primary"
                Icon={ShutdownIcon}
                InverseIcon={ShutdownReversedIcon}
                onClick={() => confirmActionDialog('Shutdown')}>
                Shutdown
              </ActionButton>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmActionDialogOpen}
        title={`${action} this machine?`}
        errorMessage={errorMessage}
        toBeConfirmed={data.name}
        onConfirmed={() => {
          setErrorMessage(null)
          machineAction({
            variables: {
              deviceId: data.deviceId,
              action: `${action}`.toLowerCase()
            }
          })
        }}
        onDissmised={() => {
          setConfirmActionDialogOpen(false)
          setErrorMessage(null)
        }}
      />
    </>
  )
}

export default Overview
