import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { DeleteDialog } from 'src/components/DeleteDialog'
import { IconButton } from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import DataTable from 'src/components/tables/DataTable'
import { H4 } from 'src/components/typography'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'

import CustomSMSModal from './CustomSMSModal'
import styles from './SMSNotices.styles'

const useStyles = makeStyles(styles)

const GET_SMS_NOTICES = gql`
  query SMSNotices {
    SMSNotices {
      id
      event
      message
      messageName
      enabled
      allowToggle
    }
  }
`

const EDIT_SMS_NOTICE = gql`
  mutation editSMSNotice($id: ID!, $event: SMSNoticeEvent!, $message: String!) {
    editSMSNotice(id: $id, event: $event, message: $message) {
      id
    }
  }
`

const ENABLE_SMS_NOTICE = gql`
  mutation enableSMSNotice($id: ID!) {
    enableSMSNotice(id: $id) {
      id
    }
  }
`

const DISABLE_SMS_NOTICE = gql`
  mutation disableSMSNotice($id: ID!) {
    disableSMSNotice(id: $id) {
      id
    }
  }
`

const SMSNotices = () => {
  const classes = useStyles()

  const [deleteDialog, setDeleteDialog] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedSMS, setSelectedSMS] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const { data: messagesData, loading: messagesLoading } = useQuery(
    GET_SMS_NOTICES
  )

  const [editMessage] = useMutation(EDIT_SMS_NOTICE, {
    onError: ({ msg }) => setErrorMsg(msg),
    refetchQueries: () => ['SMSNotices']
  })

  const [enableMessage] = useMutation(ENABLE_SMS_NOTICE, {
    onError: ({ msg }) => setErrorMsg(msg),
    refetchQueries: () => ['SMSNotices']
  })

  const [disableMessage] = useMutation(DISABLE_SMS_NOTICE, {
    onError: ({ msg }) => setErrorMsg(msg),
    refetchQueries: () => ['SMSNotices']
  })

  const loading = messagesLoading

  const handleClose = () => {
    setSelectedSMS(null)
    setShowModal(false)
    setDeleteDialog(false)
  }

  console.log(messagesData)

  const elements = [
    {
      header: 'Message name',
      width: 500,
      size: 'sm',
      textAlign: 'left',
      view: it => R.prop('messageName', it)
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
      header: 'Enable',
      width: 100,
      size: 'sm',
      textAlign: 'center',
      view: it => (
        <Switch
          disabled={!it.allowToggle}
          onClick={() => {
            it.enabled
              ? disableMessage({ variables: { id: it.id } })
              : enableMessage({ variables: { id: it.id } })
          }}
          checked={it.enabled}
        />
      )
    }
  ]

  return (
    <>
      <div className={classes.header}>
        <H4>SMS Notices</H4>
      </div>
      {showModal && (
        <CustomSMSModal
          showModal={showModal}
          onClose={handleClose}
          sms={selectedSMS}
          creationError={errorMsg}
          submit={editMessage}
        />
      )}
      <DeleteDialog
        open={deleteDialog}
        onDismissed={() => {
          handleClose()
        }}
        onConfirmed={() => {
          handleClose()
        }}
        errorMessage={errorMsg}
      />
      <DataTable
        emptyText="No SMS notices so far"
        elements={elements}
        loading={loading}
        data={R.path(['SMSNotices'])(messagesData)}
      />
    </>
  )
}

export default SMSNotices
