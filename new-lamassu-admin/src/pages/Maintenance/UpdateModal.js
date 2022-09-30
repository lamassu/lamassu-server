import { useMutation, useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { H1, P, Info2 } from 'src/components/typography'
import {
  backgroundColor,
  subheaderColor,
  spacer,
  primaryColor,
  fontPrimary,
  fontSize3
} from 'src/styling/variables'

const styles = {
  modalTitle: {
    marginTop: -5,
    color: primaryColor,
    fontFamily: fontPrimary,
    fontSize: fontSize3
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, spacer * 3, 0]]
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  button: {
    margin: [['auto', 0, 0, 'auto']]
  },
  description: {
    width: 396
  },
  outerNotes: {
    width: 396,
    height: 350,
    backgroundColor: backgroundColor,
    borderColor: subheaderColor,
    borderStyle: 'solid',
    borderWidth: 1,
    overflow: 'scroll'
  },
  notesHeader: {
    marginLeft: 25
  },
  list: {
    '& li': {
      color: primaryColor
    }
  }
}

const REQUEST_UPDATE = gql`
  mutation RequestUpdate($deviceId: ID!, $event: String!, $note: String!) {
    requestUpdate(deviceId: $deviceId, event: $event, note: $note) {
      deviceId
    }
  }
`

const GET_UPDATE_STATUSES = gql`
  query getUpdateStatuses($deviceId: ID!) {
    getUpdateStatuses(deviceId: $deviceId) {
      event
      note
      newVersion
      previousVersion
      deviceTime
    }
  }
`

const useStyles = makeStyles(styles)

const UpdateModal = ({
  showModal,
  handleClose,
  machines,
  updateInfo: { notes, versionName, version },
  isMachineUpdating
}) => {
  const classes = useStyles()
  const [error, setErrorMessage] = useState(false)

  const machine = R.head(R.filter(m => m.name === showModal)(machines))

  const [updateRequest] = useMutation(REQUEST_UPDATE, {
    onError: ({ message }) => {
      const errorMessage = message ?? 'An error ocurred'
      setErrorMessage(errorMessage)
    },
    refetchQueries: ['getMachinesUpdateStatus']
  })

  const { data: updateStatuses } = useQuery(GET_UPDATE_STATUSES, {
    variables: { deviceId: machine?.deviceId ?? '' }
  })

  const update = () => {
    updateRequest({
      variables: {
        deviceId: machine?.deviceId,
        event: 'requested',
        note: 'Update request sent.'
      }
    })
  }

  console.log(machine?.version < version, machine?.version, version)

  const releaseNotes = (
    <>
      <div className={classes.outerNotes}>
        {notes?.features && (
          <>
            <Info2 className={classes.notesHeader}>New features</Info2>
            <ul className={classes.list}>
              {R.map(f => <li>{f}</li>)(notes?.features)}
            </ul>
          </>
        )}
        {notes?.fixes && (
          <>
            <Info2 className={classes.notesHeader}>Fixes</Info2>
            <ul className={classes.list}>
              {R.map(f => <li>{f}</li>)(notes?.fixes)}
            </ul>
          </>
        )}
      </div>
    </>
  )

  const updateLogs = (
    <>
      <div className={classes.outerNotes}>
        {R.map(elem => <P>{`${elem?.deviceTime}: ${elem?.note}\n`}</P>)(
          updateStatuses?.getUpdateStatuses ?? []
        )}
      </div>
    </>
  )

  return (
    <Modal
      closeOnBackdropClick={true}
      width={460}
      height={620}
      handleClose={handleClose}
      open={Boolean(showModal)}>
      <H1
        className={
          classes.modalTitle
        }>{`${versionName} (${version}) ${machine?.name}`}</H1>
      {!isMachineUpdating(machine) && (
        <P
          className={
            classes.description
          }>{`Before updating your server, we will verify if your machine is being used. During the update, your machine will be on maintenance mode.`}</P>
      )}
      <P>
        {!isMachineUpdating(machine)
          ? `Read our release notes:`
          : `Update logs:`}
      </P>
      {!isMachineUpdating(machine) ? releaseNotes : updateLogs}
      {!isMachineUpdating(machine) && machine?.version < version && (
        <div className={classes.footer}>
          {error && <ErrorMessage>{}</ErrorMessage>}
          <Button onClick={() => update()} className={classes.button}>
            Update machine
          </Button>
        </div>
      )}
    </Modal>
  )
}

export default UpdateModal
