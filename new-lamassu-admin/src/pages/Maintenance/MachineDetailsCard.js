import { useMutation } from '@apollo/react-hooks'
import { Dialog, DialogContent } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { gql } from 'apollo-boost'
import classnames from 'classnames'
import moment from 'moment'
import React, { useState } from 'react'

import { H4 } from 'src/components/typography'

import { DialogTitle, ConfirmDialog } from '../../components/ConfirmDialog'
import { Status } from '../../components/Status'
import ActionButton from '../../components/buttons/ActionButton'
import { ReactComponent as DownloadReversedIcon } from '../../styling/icons/button/download/white.svg'
import { ReactComponent as DownloadIcon } from '../../styling/icons/button/download/zodiac.svg'
import { ReactComponent as RebootReversedIcon } from '../../styling/icons/button/reboot/white.svg'
import { ReactComponent as RebootIcon } from '../../styling/icons/button/reboot/zodiac.svg'
import { ReactComponent as ShutdownReversedIcon } from '../../styling/icons/button/shut down/white.svg'
import { ReactComponent as ShutdownIcon } from '../../styling/icons/button/shut down/zodiac.svg'
import { ReactComponent as UnpairReversedIcon } from '../../styling/icons/button/unpair/white.svg'
import { ReactComponent as UnpairIcon } from '../../styling/icons/button/unpair/zodiac.svg'
import { zircon } from '../../styling/variables'
import {
  detailsRowStyles,
  labelStyles
} from '../Transactions/Transactions.styles'

const MACHINE_ACTION = gql`
  mutation MachineAction($deviceId: ID!, $action: MachineAction!) {
    machineAction(deviceId: $deviceId, action: $action) {
      deviceId
    }
  }
`

const colDivider = {
  background: zircon,
  width: 2
}

const inlineChip = {
  marginInlineEnd: '0.25em'
}

const useLStyles = makeStyles(labelStyles)

const Label = ({ children }) => {
  const classes = useLStyles()

  return <div className={classes.label}>{children}</div>
}

const useMDStyles = makeStyles({ ...detailsRowStyles, colDivider, inlineChip })

const MachineDetailsRow = ({ it: machine }) => {
  const [errorDialog, setErrorDialog] = useState(false)
  const [dialogOpen, setOpen] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)
  const classes = useMDStyles()

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
        <div className={classnames(classes.row)}>
          <div className={classnames(classes.col)}>
            <div className={classnames(classes.row)}>
              <div className={classnames(classes.col, classes.col2)}>
                <div className={classes.innerRow}>
                  <div>
                    <Label>Statuses</Label>
                    <div>
                      {machine.statuses.map((status, index) => (
                        <Status status={status} key={index} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Lamassu Support article</Label>
                    <div>
                      {machine.statuses.map((...[, index]) => (
                        <span key={index} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className={classnames(
              classes.col,
              classes.col2,
              classes.colDivider
            )}
          />
          <div className={classnames(classes.col)}>
            <div className={classnames(classes.row)}>
              <div className={classnames(classes.col, classes.col2)}>
                <div className={classes.innerRow}>
                  <div>
                    <Label>Machine Model</Label>
                    <div>{machine.machineModel}</div>
                  </div>
                  <div className={classes.commissionWrapper}>
                    <Label>Address</Label>
                    <div>{machine.machineLocation}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={classnames(classes.row)}>
              <div className={classnames(classes.col, classes.col2)}>
                <div className={classes.innerRow}>
                  <div>
                    <Label>Paired at</Label>
                    <div>
                      {moment(machine.pairedAt).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                  </div>
                  <div className={classes.commissionWrapper}>
                    <Label>Software update</Label>
                    <div className={classes.innerRow}>
                      {machine.softwareVersion && (
                        <span className={classes.inlineChip}>
                          {machine.softwareVersion}
                        </span>
                      )}
                      <ActionButton
                        className={classes.inlineChip}
                        disabled
                        color="primary"
                        Icon={DownloadIcon}
                        InverseIcon={DownloadReversedIcon}>
                        Update
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={classnames(classes.row)}>
              <div className={classnames(classes.col, classes.col2)}>
                <div className={classes.innerRow}>
                  <div>
                    <Label>Printer</Label>
                    <div>{machine.printer || 'unknown'}</div>
                  </div>
                  <div className={classes.commissionWrapper}>
                    <Label>Actions</Label>
                    <div className={classes.innerRow}>
                      <ActionButton
                        className={classes.inlineChip}
                        color="primary"
                        Icon={UnpairIcon}
                        InverseIcon={UnpairReversedIcon}
                        disabled={loading}
                        onClick={unpairDialog}>
                        Unpair
                      </ActionButton>
                      <ConfirmDialog
                        open={dialogOpen}
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
                        className={classes.inlineChip}
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
                        className={classes.inlineChip}
                        disabled={loading}
                        color="primary"
                        Icon={ShutdownIcon}
                        InverseIcon={ShutdownReversedIcon}
                        onClick={() => {
                          machineAction({
                            variables: {
                              deviceId: machine.deviceId,
                              action: 'shutdown'
                            }
                          })
                        }}>
                        Shutdown
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MachineDetailsRow
