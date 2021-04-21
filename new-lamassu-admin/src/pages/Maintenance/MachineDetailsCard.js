import { useMutation, useLazyQuery } from '@apollo/react-hooks'
import { Grid /*, Divider */ } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import moment from 'moment'
import React, { useState } from 'react'

import { ConfirmDialog } from 'src/components/ConfirmDialog'
// import { Status } from 'src/components/Status'
import ActionButton from 'src/components/buttons/ActionButton'
import { ReactComponent as EditReversedIcon } from 'src/styling/icons/button/edit/white.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/button/edit/zodiac.svg'
// import { ReactComponent as LinkIcon } from 'src/styling/icons/button/link/zodiac.svg'
import { ReactComponent as RebootReversedIcon } from 'src/styling/icons/button/reboot/white.svg'
import { ReactComponent as RebootIcon } from 'src/styling/icons/button/reboot/zodiac.svg'
import { ReactComponent as ShutdownReversedIcon } from 'src/styling/icons/button/shut down/white.svg'
import { ReactComponent as ShutdownIcon } from 'src/styling/icons/button/shut down/zodiac.svg'
import { ReactComponent as UnpairReversedIcon } from 'src/styling/icons/button/unpair/white.svg'
import { ReactComponent as UnpairIcon } from 'src/styling/icons/button/unpair/zodiac.svg'
import { modelPrettifier } from 'src/utils/machine'

import { labelStyles, machineDetailsStyles } from './MachineDetailsCard.styles'

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

// const supportArtices = [
//   {
//     // Default article for non-maped statuses
//     code: undefined,
//     label: 'Troubleshooting',
//     article:
//       'https://support.lamassu.is/hc/en-us/categories/115000075249-Troubleshooting'
//   }
//   // TODO add Stuck and Fully Functional statuses articles for the new-admins
// ]

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

// const article = ({ code: status }) =>
//   supportArtices.find(({ code: article }) => article === status)

const useLStyles = makeStyles(labelStyles)

const Label = ({ children }) => {
  const classes = useLStyles()

  return <div className={classes.label}>{children}</div>
}

const useMDStyles = makeStyles(machineDetailsStyles)

const Container = ({ children, ...props }) => (
  <Grid container spacing={4} {...props}>
    {children}
  </Grid>
)

const Item = ({ children, ...props }) => (
  <Grid item xs {...props}>
    {children}
  </Grid>
)

const getState = machineEventsLazy =>
  JSON.parse(machineEventsLazy.machine.latestEvent?.note ?? '{"state": null}')
    .state

const MachineDetailsRow = ({ it: machine, onActionSuccess }) => {
  const [action, setAction] = useState({ command: null })
  const [errorMessage, setErrorMessage] = useState(null)
  const classes = useMDStyles()

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
    <Container className={classes.wrapper}>
      {/* <Item xs={5}>
        <Container>
          <Item>
            <Label>Statuses</Label>
            <ul className={classes.list}>
              {machine.statuses.map((status, index) => (
                <li className={classes.item} key={index}>
                  <Status status={status} />
                </li>
              ))}
            </ul>
          </Item>
          <Item>
            <Label>Lamassu Support article</Label>
            <ul className={classes.list}>
              {machine.statuses
                .map(article)
                .map(({ label, article }, index) => (
                  <li className={classes.item} key={index}>
                    <a
                      className={classes.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      href={article}>
                      '{label}' <LinkIcon />
                    </a>
                  </li>
                ))}
            </ul>
          </Item>
        </Container>
      </Item>
      <Divider
        orientation="vertical"
        flexItem
        className={classes.separator}
      /> */}
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
        onDissmised={() => {
          setAction({ command: null })
          setErrorMessage(null)
        }}
      />
      <Item xs>
        <Container className={classes.row}>
          <Item xs={2}>
            <Label>Machine Model</Label>
            <span>{modelPrettifier[machine.model]}</span>
          </Item>
          <Item xs={4}>
            <Label>Paired at</Label>
            <span>
              {moment(machine.pairedAt).format('YYYY-MM-DD HH:mm:ss')}
            </span>
          </Item>
          <Item xs={6}>
            <Label>Actions</Label>
            <div className={classes.stack}>
              <ActionButton
                className={classes.mr}
                disabled={loading}
                color="primary"
                Icon={EditIcon}
                InverseIcon={EditReversedIcon}
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
                className={classes.mr}
                disabled={loading}
                color="primary"
                Icon={ShutdownIcon}
                InverseIcon={ShutdownReversedIcon}
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
          </Item>
        </Container>
        {/* <Container>
          <Item>
            <Label>Actions</Label>
            <div className={classes.stack}>
              <ActionButton
                className={classes.mr}
                disabled={loading}
                color="primary"
                Icon={EditIcon}
                InverseIcon={EditReversedIcon}
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
                className={classes.mr}
                disabled={loading}
                color="primary"
                Icon={ShutdownIcon}
                InverseIcon={ShutdownReversedIcon}
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
          </Item>
        </Container> */}
      </Item>
    </Container>
  )
}

export default MachineDetailsRow
