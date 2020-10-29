import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import moment from 'moment'
import React, { useState } from 'react'

import { ConfirmDialog } from 'src/components/ConfirmDialog'
import { Status } from 'src/components/Status'
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

const Details = ({ data, onActionSuccess }) => {
  const [action, setAction] = useState('')
  const [confirmActionDialogOpen, setConfirmActionDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
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
  const classes = useStyles()
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around'
        }}>
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
                onClick={() => confirmActionDialog('Unpair')}>
                Unpair
              </ActionButton>
              <ActionButton
                style={{ marginRight: 'auto' }}
                color="primary"
                className={classes.mr}
                Icon={RebootIcon}
                InverseIcon={RebootReversedIcon}
                onClick={() => confirmActionDialog('Reboot')}>
                Reboot
              </ActionButton>
              <ActionButton
                style={{ marginRight: 'auto' }}
                className={classes.inlineChip}
                color="primary"
                Icon={ShutdownIcon}
                InverseIcon={ShutdownReversedIcon}
                onClick={() => confirmActionDialog('Shutdown')}>
                Shutdown
              </ActionButton>
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          {' '}
          <Label4 className={classes.tl2}>Status</Label4>
          {data && data.statuses ? <Status status={data.statuses[0]} /> : null}
          {/*           <Label4 className={classes.tl2}>Machine model</Label4>
          <P>{data.model}</P> */}
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
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around'
        }}>
        <div style={{ flex: 1 }}>
          <Label4 className={classes.tl2}>Machine model</Label4>
          <P>{data.model}</P>
        </div>
        <div style={{ flex: 1 }}>
          {' '}
          <Label4 className={classes.tl2}>Software version</Label4>
          <P>{data.version}</P>
        </div>

        <div style={{ flex: 1 }}>
          {' '}
          <Label4 className={classes.tl2}>Paired at</Label4>
          <P>
            {data.pairedAt
              ? moment(data.pairedAt).format('YYYY-MM-DD HH:mm:ss')
              : ''}
          </P>
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

export default Details
