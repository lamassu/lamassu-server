import { useMutation } from '@apollo/react-hooks'
import { Dialog, DialogContent } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import moment from 'moment'
import React, { useState } from 'react'

import { DialogTitle, ConfirmDialog } from 'src/components/ConfirmDialog'
import { Status } from 'src/components/Status'
import ActionButton from 'src/components/buttons/ActionButton'
import { Label1, H4 } from 'src/components/typography'
import { ReactComponent as RebootReversedIcon } from 'src/styling/icons/button/reboot/white.svg'
import { ReactComponent as RebootIcon } from 'src/styling/icons/button/reboot/zodiac.svg'
import { ReactComponent as UnpairReversedIcon } from 'src/styling/icons/button/unpair/white.svg'
import { ReactComponent as UnpairIcon } from 'src/styling/icons/button/unpair/zodiac.svg'

import styles from './MachineDetailsCard.styles'

const MACHINE_ACTION = gql`
  mutation MachineAction($deviceId: ID!, $action: MachineAction!) {
    machineAction(deviceId: $deviceId, action: $action) {
      deviceId
    }
  }
`

const useStyles = makeStyles(styles)

const Label = ({ children }) => {
  const classes = useStyles()
  return <Label1 className={classes.label}>{children}</Label1>
}

const MachineDetailsRow = ({ it: machine }) => {
  const [errorDialog, setErrorDialog] = useState(false)
  const [dialogOpen, setOpen] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)
  const classes = useStyles()

  const unpairDialog = () => setOpen(true)

  const [machineAction, { loading }] = useMutation(MACHINE_ACTION, {
    onError: ({ graphQLErrors, message }) => {
      const errorMessage = graphQLErrors[0] ? graphQLErrors[0].message : message
      setActionMessage(errorMessage)
      setErrorDialog(true)
    }
  })

  return (
    <>
      <Dialog open={errorDialog} aria-labelledby="form-dialog-title">
        <DialogTitle
          id="customized-dialog-title"
          onClose={() => setErrorDialog(false)}>
          <H4>Error</H4>
        </DialogTitle>
        <DialogContent>{actionMessage}</DialogContent>
      </Dialog>
      <div className={classes.wrapper}>
        <div className={classes.column1}>
          <div className={classes.lastRow}>
            <div className={classes.status}>
              <Label>Statuses</Label>
              <div>
                {machine.statuses.map((status, index) => (
                  <Status
                    className={classes.chips}
                    status={status}
                    key={index}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Lamassu Support article</Label>
              <div>
                {machine.statuses.map((...[, index]) => (
                  // TODO new-admin: support articles
                  <span key={index}></span>
                ))}
              </div>
            </div>
            <div className={classes.separator} />
          </div>
        </div>
        <div className={classes.column2}>
          <div className={classes.row}>
            <div className={classes.machineModel}>
              <Label>Machine Model</Label>
              <div>{machine.model ?? 'unknown'}</div>
            </div>
            <div>
              <Label>Paired at</Label>
              <div>
                {machine.pairedAt
                  ? moment(machine.pairedAt).format('YYYY-MM-DD HH:mm:ss')
                  : 'N/A'}
              </div>
            </div>
          </div>
          <div className={classes.lastRow}>
            <div>
              <Label>Actions</Label>
              <div className={classes.actionRow}>
                <ActionButton
                  className={classes.action}
                  color="primary"
                  Icon={UnpairIcon}
                  InverseIcon={UnpairReversedIcon}
                  disabled={loading}
                  onClick={unpairDialog}>
                  Unpair
                </ActionButton>
                <ConfirmDialog
                  open={dialogOpen}
                  className={classes.dialog}
                  title="Unpair this machine?"
                  subtitle={false}
                  toBeConfirmed={machine.name}
                  onConfirmed={() => {
                    setOpen(false)
                    machineAction({
                      variables: {
                        deviceId: machine.deviceId,
                        action: 'unpair'
                      }
                    })
                  }}
                  onDissmised={() => {
                    setOpen(false)
                  }}
                />
                <ActionButton
                  className={classes.action}
                  color="primary"
                  Icon={RebootIcon}
                  InverseIcon={RebootReversedIcon}
                  disabled={loading}
                  onClick={() => {
                    machineAction({
                      variables: {
                        deviceId: machine.deviceId,
                        action: 'reboot'
                      }
                    })
                  }}>
                  Reboot
                </ActionButton>
                <ActionButton
                  className={classes.action}
                  disabled={loading}
                  color="primary"
                  Icon={RebootIcon}
                  InverseIcon={RebootReversedIcon}
                  onClick={() => {
                    machineAction({
                      variables: {
                        deviceId: machine.deviceId,
                        action: 'restartServices'
                      }
                    })
                  }}>
                  Restart Services
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MachineDetailsRow
