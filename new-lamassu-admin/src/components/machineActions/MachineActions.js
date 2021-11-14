import { useMutation, useLazyQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import React, { memo, useState } from 'react'

import { ConfirmDialog } from 'src/components/ConfirmDialog'
import ActionButton from 'src/components/buttons/ActionButton'
import { ReactComponent as EditReversedIcon } from 'src/styling/icons/button/edit/white.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/button/edit/zodiac.svg'
import { ReactComponent as RebootReversedIcon } from 'src/styling/icons/button/reboot/white.svg'
import { ReactComponent as RebootIcon } from 'src/styling/icons/button/reboot/zodiac.svg'
import { ReactComponent as ShutdownReversedIcon } from 'src/styling/icons/button/shut down/white.svg'
import { ReactComponent as ShutdownIcon } from 'src/styling/icons/button/shut down/zodiac.svg'
import { ReactComponent as UnpairReversedIcon } from 'src/styling/icons/button/unpair/white.svg'
import { ReactComponent as UnpairIcon } from 'src/styling/icons/button/unpair/zodiac.svg'

import { machineActionsStyles } from './MachineActions.styles'

const useStyles = makeStyles(machineActionsStyles)

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

const MACHINE = gql`
  query getMachine($deviceId: ID!) {
    machine(deviceId: $deviceId) {
      latestEvent {
        note
      }
    }
  }
`

const isStaticState = machineState => {
  if (!machineState) {
    return true
  }
  const staticStates = [
    'chooseCoin',
    'idle',
    'pendingIdle',
    'dualIdle',
    'networkDown',
    'unpaired',
    'maintenance',
    'virgin',
    'wifiList'
  ]
  return staticStates.includes(machineState)
}

const getState = machineEventsLazy =>
  JSON.parse(machineEventsLazy.machine.latestEvent?.note ?? '{"state": null}')
    .state

const Label = ({ children }) => {
  const classes = useStyles()

  return <div className={classes.label}>{children}</div>
}

const MachineActions = memo(({ machine, onActionSuccess }) => {
  const [action, setAction] = useState({ command: null })
  const [errorMessage, setErrorMessage] = useState(null)
  const classes = useStyles()

  const warningMessage = (
    <span className={classes.warning}>
      A user may be in the middle of a transaction and they could lose their
      funds if you continue.
    </span>
  )

  const [fetchMachineEvents, { loading: loadingEvents }] = useLazyQuery(
    MACHINE,
    {
      variables: {
        deviceId: machine.deviceId
      },
      onCompleted: machineEventsLazy => {
        const message = !isStaticState(getState(machineEventsLazy))
          ? warningMessage
          : null
        setAction(action => ({ ...action, message }))
      }
    }
  )

  const [machineAction, { loading }] = useMutation(MACHINE_ACTION, {
    onError: ({ message }) => {
      const errorMessage = message ?? 'An error ocurred'
      setErrorMessage(errorMessage)
    },
    onCompleted: () => {
      onActionSuccess && onActionSuccess()
      setAction({ command: null })
    }
  })

  const confirmDialogOpen = Boolean(action.command)
  const disabled = !!(action?.command === 'restartServices' && loadingEvents)

  return (
    <div>
      <Label>Actions</Label>
      <div className={classes.stack}>
        <ActionButton
          color="primary"
          className={classes.mr}
          Icon={EditIcon}
          InverseIcon={EditReversedIcon}
          disabled={loading}
          onClick={() =>
            setAction({
              command: 'rename',
              display: 'Rename',
              confirmationMessage: 'Write the new name for this machine'
            })
          }>
          Rename
        </ActionButton>
        <ActionButton
          color="primary"
          className={classes.mr}
          Icon={UnpairIcon}
          InverseIcon={UnpairReversedIcon}
          disabled={loading}
          onClick={() =>
            setAction({
              command: 'unpair',
              display: 'Unpair'
            })
          }>
          Unpair
        </ActionButton>
        <ActionButton
          color="primary"
          className={classes.mr}
          Icon={RebootIcon}
          InverseIcon={RebootReversedIcon}
          disabled={loading}
          onClick={() =>
            setAction({
              command: 'reboot',
              display: 'Reboot'
            })
          }>
          Reboot
        </ActionButton>
        <ActionButton
          color="primary"
          className={classes.mr}
          Icon={ShutdownIcon}
          InverseIcon={ShutdownReversedIcon}
          disabled={loading}
          onClick={() =>
            setAction({
              command: 'shutdown',
              display: 'Shutdown',
              message:
                'In order to bring it back online, the machine will need to be visited and its power reset.'
            })
          }>
          Shutdown
        </ActionButton>
        <ActionButton
          color="primary"
          className={classes.inlineChip}
          Icon={RebootIcon}
          InverseIcon={RebootReversedIcon}
          disabled={loading}
          onClick={() => {
            fetchMachineEvents()
            setAction({
              command: 'restartServices',
              display: 'Restart services for'
            })
          }}>
          Restart Services
        </ActionButton>
      </div>
      <ConfirmDialog
        disabled={disabled}
        open={confirmDialogOpen}
        title={`${action?.display} this machine?`}
        errorMessage={errorMessage}
        toBeConfirmed={machine.name}
        message={action?.message}
        confirmationMessage={action?.confirmationMessage}
        saveButtonAlwaysEnabled={action?.command === 'rename'}
        onConfirmed={value => {
          setErrorMessage(null)
          machineAction({
            variables: {
              deviceId: machine.deviceId,
              action: `${action?.command}`,
              ...(action?.command === 'rename' && { newName: value })
            }
          })
        }}
        onDismissed={() => {
          setAction({ command: null })
          setErrorMessage(null)
        }}
      />
    </div>
  )
})

export default MachineActions
