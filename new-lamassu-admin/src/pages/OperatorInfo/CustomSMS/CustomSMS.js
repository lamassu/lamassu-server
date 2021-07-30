import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { DeleteDialog } from 'src/components/DeleteDialog'
import { Link, IconButton } from 'src/components/buttons'
import DataTable from 'src/components/tables/DataTable'
import { H4 } from 'src/components/typography'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'

import styles from './CustomSMS.styles'
import CustomSMSModal from './CustomSMSModal'

const useStyles = makeStyles(styles)

const GET_CUSTOM_MESSAGES = gql`
  query customMessages {
    customMessages {
      id
      event
      deviceId
      message
    }
  }
`

const CREATE_CUSTOM_MESSAGE = gql`
  mutation createCustomMessage(
    $event: CustomMessageEvent!
    $deviceId: String!
    $message: String!
  ) {
    createCustomMessage(event: $event, deviceId: $deviceId, message: $message) {
      id
    }
  }
`

const EDIT_CUSTOM_MESSAGE = gql`
  mutation editCustomMessage(
    $id: ID!
    $event: CustomMessageEvent!
    $deviceId: String!
    $message: String!
  ) {
    editCustomMessage(
      id: $id
      event: $event
      deviceId: $deviceId
      message: $message
    ) {
      id
    }
  }
`

const DELETE_CUSTOM_MESSAGE = gql`
  mutation deleteCustomMessage($id: ID!) {
    deleteCustomMessage(id: $id) {
      id
    }
  }
`

const GET_MACHINES = gql`
  {
    machines {
      name
      deviceId
    }
  }
`

const EVENT_OPTIONS = [
  { code: 'smsCode', display: 'On SMS confirmation code' },
  { code: 'cashOutDispenseReady', display: 'Cash out dispense ready' }
]

const CustomSMS = () => {
  const classes = useStyles()

  const [deleteDialog, setDeleteDialog] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedSMS, setSelectedSMS] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const { data: messagesData, loading: messagesLoading } = useQuery(
    GET_CUSTOM_MESSAGES
  )

  const { data: machinesData, loading: machinesLoading } = useQuery(
    GET_MACHINES
  )

  const [createMessage] = useMutation(CREATE_CUSTOM_MESSAGE, {
    onError: ({ msg }) => setErrorMsg(msg),
    refetchQueries: () => ['customMessages']
  })

  const [editMessage] = useMutation(EDIT_CUSTOM_MESSAGE, {
    onError: ({ msg }) => setErrorMsg(msg),
    refetchQueries: () => ['customMessages']
  })

  const [deleteMessage] = useMutation(DELETE_CUSTOM_MESSAGE, {
    onError: ({ msg }) => setErrorMsg(msg),
    refetchQueries: () => ['customMessages']
  })

  const loading = messagesLoading && machinesLoading

  const machineOptions =
    (machinesData &&
      R.map(
        it => ({ code: it.deviceId, display: it.name }),
        R.path(['machines'])(machinesData)
      )) ??
    []

  const handleClose = () => {
    setSelectedSMS(null)
    setShowModal(false)
    setDeleteDialog(false)
  }

  const handleOpen = () => {
    setErrorMsg('')
    setShowModal(true)
  }

  const elements = [
    {
      header: 'Event',
      width: 400,
      size: 'sm',
      textAlign: 'left',
      view: it =>
        R.find(ite => R.propEq('event', ite.code, it), EVENT_OPTIONS).display
    },
    {
      header: 'Machine',
      width: 200,
      size: 'sm',
      textAlign: 'left',
      view: it =>
        R.find(ite => R.propEq('deviceId', ite.code, it), machineOptions)
          ?.display ?? `All Machines`
    },
    {
      header: 'Edit',
      width: 100,
      size: 'sm',
      textAlign: 'center',
      view: it => (
        <IconButton
          onClick={() => {
            setSelectedSMS(it)
            setShowModal(true)
          }}>
          <EditIcon />
        </IconButton>
      )
    },
    {
      header: 'Delete',
      width: 100,
      size: 'sm',
      textAlign: 'center',
      view: it => (
        <IconButton
          onClick={() => {
            setSelectedSMS(it)
            setDeleteDialog(true)
          }}>
          <DeleteIcon />
        </IconButton>
      )
    }
  ]

  return (
    <>
      <div className={classes.header}>
        <H4>Custom SMS message</H4>
        <Box display="flex" justifyContent="flex-end">
          <Link color="primary" onClick={() => handleOpen()}>
            Add custom SMS
          </Link>
        </Box>
      </div>
      {showModal && (
        <CustomSMSModal
          showModal={showModal}
          onClose={handleClose}
          machineOptions={machineOptions}
          eventOptions={EVENT_OPTIONS}
          sms={selectedSMS}
          creationError={errorMsg}
          submit={selectedSMS ? editMessage : createMessage}
        />
      )}
      <DeleteDialog
        open={deleteDialog}
        onDismissed={() => {
          handleClose()
        }}
        onConfirmed={() => {
          handleClose()
          deleteMessage({
            variables: {
              id: selectedSMS.id
            }
          })
        }}
        errorMessage={errorMsg}
      />
      <DataTable
        emptyText="No custom SMS so far"
        elements={elements}
        loading={loading}
        data={R.path(['customMessages'])(messagesData)}
      />
    </>
  )
}

export default CustomSMS
