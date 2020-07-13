import { useMutation } from '@apollo/react-hooks'
import { Grid, Divider } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import moment from 'moment'
import React, { useState } from 'react'

import { ConfirmDialog } from 'src/components/ConfirmDialog'
import { Status } from 'src/components/Status'
import ActionButton from 'src/components/buttons/ActionButton'
import {
  detailsRowStyles,
  labelStyles
} from 'src/pages/Transactions/Transactions.styles'
import { ReactComponent as DownloadReversedIcon } from 'src/styling/icons/button/download/white.svg'
import { ReactComponent as DownloadIcon } from 'src/styling/icons/button/download/zodiac.svg'
import { ReactComponent as LinkIcon } from 'src/styling/icons/button/link/zodiac.svg'
import { ReactComponent as RebootReversedIcon } from 'src/styling/icons/button/reboot/white.svg'
import { ReactComponent as RebootIcon } from 'src/styling/icons/button/reboot/zodiac.svg'
import { ReactComponent as ShutdownReversedIcon } from 'src/styling/icons/button/shut down/white.svg'
import { ReactComponent as ShutdownIcon } from 'src/styling/icons/button/shut down/zodiac.svg'
import { ReactComponent as UnpairReversedIcon } from 'src/styling/icons/button/unpair/white.svg'
import { ReactComponent as UnpairIcon } from 'src/styling/icons/button/unpair/zodiac.svg'
import { spacer, comet, primaryColor } from 'src/styling/variables'

const MACHINE_ACTION = gql`
  mutation MachineAction($deviceId: ID!, $action: MachineAction!) {
    machineAction(deviceId: $deviceId, action: $action) {
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

const colDivider = {
  width: 1,
  margin: [[spacer * 2, spacer * 4]],
  backgroundColor: comet,
  border: 'none'
}

const inlineChip = {
  marginInlineEnd: '0.25em'
}

const useLStyles = makeStyles(labelStyles)

const Label = ({ children }) => {
  const classes = useLStyles()

  return <div className={classes.label}>{children}</div>
}

const stack = {
  display: 'flex',
  flexDirection: 'row'
}

const useMDStyles = makeStyles({
  ...detailsRowStyles,
  colDivider,
  inlineChip,
  stack,
  details: {
    height: '100%',
    padding: [[spacer * 3, 0]]
  },
  list: {
    padding: 0,
    margin: 0,
    listStyle: 'none',
    '& > li': {
      height: spacer * 3,
      marginBottom: spacer * 1.5,
      '& > a, & > a:visited': {
        color: primaryColor,
        textDecoration: 'none'
      }
    }
  },
  divider: {
    margin: '0 1rem'
  },
  mr: {
    marginRight: spacer
  }
})

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
  const [dialogOpen, setOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const classes = useMDStyles()

  const confirmDialog = action => setAction(action) || setOpen(true)

  const [machineAction, { loading }] = useMutation(MACHINE_ACTION, {
    onError: ({ message }) => {
      const errorMessage = message ?? 'An error ocurred'
      setErrorMessage(errorMessage)
    },
    onCompleted: () => {
      // TODO: custom onActionSuccess needs to be passed down from the machinestatus table
      onActionSuccess ? onActionSuccess() : window.location.reload()
      setOpen(false)
    }
  })

  return (
    <>
      <Container className={classes.details}>
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
          className={classes.colDivider}
        />
        <ConfirmDialog
          open={dialogOpen}
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
            setOpen(false)
            setErrorMessage(null)
          }}
        />
        <Item xs>
          <Container>
            <Item xs={4}>
              <Label>Machine Model</Label>
              <span>{machine.model}</span>
            </Item>
            <Item>
              <Label>Address</Label>
              <span>{machine.machineLocation}</span>
            </Item>
          </Container>
          <Container>
            <Item xs={4}>
              <Label>Paired at</Label>
              <span>
                {moment(machine.pairedAt).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            </Item>
            <Item>
              <Label>Software update</Label>

              <div className={classes.stack}>
                {machine.version && (
                  <span className={classes.mr}>{machine.version}</span>
                )}
                <ActionButton
                  color="primary"
                  Icon={DownloadIcon}
                  InverseIcon={DownloadReversedIcon}
                  className={classes.mr}
                  disabled={loading}
                  onClick={() => confirmDialog('Update')}>
                  Update
                </ActionButton>
              </div>
            </Item>
          </Container>
          <Container>
            <Item xs={4}>
              <Label>Printer</Label>
              <div>{machine.printer || 'unknown'}</div>
            </Item>
            <Item>
              <Label>Actions</Label>
              <div className={classes.stack}>
                <ActionButton
                  color="primary"
                  className={classes.mr}
                  Icon={UnpairIcon}
                  InverseIcon={UnpairReversedIcon}
                  disabled={loading}
                  onClick={() => confirmDialog('Unpair')}>
                  Unpair
                </ActionButton>
                <ActionButton
                  color="primary"
                  className={classes.mr}
                  Icon={RebootIcon}
                  InverseIcon={RebootReversedIcon}
                  disabled={loading}
                  onClick={() => confirmDialog('Reboot')}>
                  Reboot
                </ActionButton>
                <ActionButton
                  className={classes.inlineChip}
                  disabled={loading}
                  color="primary"
                  Icon={ShutdownIcon}
                  InverseIcon={ShutdownReversedIcon}
                  onClick={() => confirmDialog('Shutdown')}>
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
