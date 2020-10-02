import { useMutation } from '@apollo/react-hooks'
import { Grid, Divider } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import moment from 'moment'
import React, { useState } from 'react'

import { ConfirmDialog } from 'src/components/ConfirmDialog'
import { Status } from 'src/components/Status'
import ActionButton from 'src/components/buttons/ActionButton'
import { ReactComponent as EditReversedIcon } from 'src/styling/icons/button/edit/white.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/button/edit/zodiac.svg'
import { ReactComponent as LinkIcon } from 'src/styling/icons/button/link/zodiac.svg'
import { ReactComponent as RebootReversedIcon } from 'src/styling/icons/button/reboot/white.svg'
import { ReactComponent as RebootIcon } from 'src/styling/icons/button/reboot/zodiac.svg'
import { ReactComponent as ShutdownReversedIcon } from 'src/styling/icons/button/shut down/white.svg'
import { ReactComponent as ShutdownIcon } from 'src/styling/icons/button/shut down/zodiac.svg'
import { ReactComponent as UnpairReversedIcon } from 'src/styling/icons/button/unpair/white.svg'
import { ReactComponent as UnpairIcon } from 'src/styling/icons/button/unpair/zodiac.svg'

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

const supportArtices = [
  {
    // Default article for non-maped statuses
    code: undefined,
    label: 'Troubleshooting',
    article:
      'https://support.lamassu.is/hc/en-us/categories/115000075249-Troubleshooting'
  }
]

const article = ({ code: status }) =>
  supportArtices.find(({ code: article }) => article === status)

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

const MachineDetailsRow = ({ it: machine, onActionSuccess }) => {
  const [action, setAction] = useState('')
  const [renameActionDialogOpen, setRenameActionDialogOpen] = useState(false)
  const [confirmActionDialogOpen, setConfirmActionDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const classes = useMDStyles()

  const confirmActionDialog = action =>
    setAction(action) || setConfirmActionDialogOpen(true)

  const renameActionDialog = () =>
    setAction('Rename') || setRenameActionDialogOpen(true)

  const [machineAction, { loading }] = useMutation(MACHINE_ACTION, {
    onError: ({ message }) => {
      const errorMessage = message ?? 'An error ocurred'
      setErrorMessage(errorMessage)
    },
    onCompleted: () => {
      // TODO: custom onActionSuccess needs to be passed down from the machinestatus table
      onActionSuccess ? onActionSuccess() : window.location.reload()
      setConfirmActionDialogOpen(false)
    }
  })

  return (
    <>
      <Container className={classes.wrapper}>
        <Item xs={5}>
          <Container>
            <Item>
              <Label>Statuses</Label>
              <ul className={classes.list}>
                {machine.statuses.map((status, index) => (
                  <li key={index}>
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
                    <li key={index}>
                      <a
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
        />
        <ConfirmDialog
          open={renameActionDialogOpen}
          title={`Rename this machine?`}
          initialValue={machine.name}
          errorMessage={errorMessage}
          confirmationMessage={`Write the new name for this machine`}
          saveButtonAlwaysEnabled={true}
          onConfirmed={value => {
            setErrorMessage(null)
            machineAction({
              variables: {
                deviceId: machine.deviceId,
                action: `${action}`.toLowerCase(),
                newName: value
              }
            })
          }}
          onDissmised={() => {
            setRenameActionDialogOpen(false)
            setErrorMessage(null)
          }}
        />
        <ConfirmDialog
          open={confirmActionDialogOpen}
          title={`${action} this machine?`}
          errorMessage={errorMessage}
          toBeConfirmed={machine.name}
          onConfirmed={() => {
            setErrorMessage(null)
            machineAction({
              variables: {
                deviceId: machine.deviceId,
                action: `${action}`.toLowerCase()
              }
            })
          }}
          onDissmised={() => {
            setConfirmActionDialogOpen(false)
            setErrorMessage(null)
          }}
        />
        <Item xs>
          <Container className={classes.row}>
            <Item xs={4}>
              <Label>Machine Model</Label>
              <span>{machine.model}</span>
            </Item>
            <Item xs={4}>
              <Label>Paired at</Label>
              <span>
                {moment(machine.pairedAt).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            </Item>
          </Container>
          <Container>
            <Item>
              <Label>Actions</Label>
              <div className={classes.stack}>
                <ActionButton
                  className={classes.mr}
                  disabled={loading}
                  color="primary"
                  Icon={EditIcon}
                  InverseIcon={EditReversedIcon}
                  onClick={() => renameActionDialog()}>
                  Rename
                </ActionButton>
                <ActionButton
                  color="primary"
                  className={classes.mr}
                  Icon={UnpairIcon}
                  InverseIcon={UnpairReversedIcon}
                  disabled={loading}
                  onClick={() => confirmActionDialog('Unpair')}>
                  Unpair
                </ActionButton>
                <ActionButton
                  color="primary"
                  className={classes.mr}
                  Icon={RebootIcon}
                  InverseIcon={RebootReversedIcon}
                  disabled={loading}
                  onClick={() => confirmActionDialog('Reboot')}>
                  Reboot
                </ActionButton>
                <ActionButton
                  className={classes.inlineChip}
                  disabled={loading}
                  color="primary"
                  Icon={ShutdownIcon}
                  InverseIcon={ShutdownReversedIcon}
                  onClick={() => confirmActionDialog('Shutdown')}>
                  Shutdown
                </ActionButton>
              </div>
            </Item>
          </Container>
        </Item>
      </Container>
    </>
  )
}

export default MachineDetailsRow
