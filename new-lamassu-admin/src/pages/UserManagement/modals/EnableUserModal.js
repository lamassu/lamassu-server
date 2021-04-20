import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { Info2, P } from 'src/components/typography'

import styles from '../UserManagement.styles'

import Input2FAModal from './Input2FAModal'

const ENABLE_USER = gql`
  mutation enableUser($confirmationCode: String, $id: ID!) {
    enableUser(confirmationCode: $confirmationCode, id: $id) {
      id
    }
  }
`

const DISABLE_USER = gql`
  mutation disableUser($confirmationCode: String, $id: ID!) {
    disableUser(confirmationCode: $confirmationCode, id: $id) {
      id
    }
  }
`

const useStyles = makeStyles(styles)

const EnableUserModal = ({ state, dispatch, user, requiresConfirmation }) => {
  const classes = useStyles()

  const [enableUser] = useMutation(ENABLE_USER, {
    refetchQueries: () => ['users']
  })

  const [disableUser] = useMutation(DISABLE_USER, {
    refetchQueries: () => ['users']
  })

  const [confirmation, setConfirmation] = useState(null)

  const disable = () => {
    disableUser({
      variables: {
        confirmationCode: confirmation,
        id: user.id
      }
    })
  }

  const enable = () => {
    enableUser({
      variables: {
        confirmationCode: confirmation,
        id: user.id
      }
    })
  }

  const submit = () => {
    user?.enabled ? disable() : enable()
    handleClose()
  }

  const handleClose = () => {
    setConfirmation(null)
    dispatch({
      type: 'close',
      payload: 'showEnableUserModal'
    })
  }

  return (
    (state.showEnableUserModal && requiresConfirmation && !confirmation && (
      <Input2FAModal
        showModal={state.showEnableUserModal}
        handleClose={handleClose}
        setConfirmation={setConfirmation}
      />
    )) ||
    (state.showEnableUserModal && (
      <Modal
        closeOnBackdropClick={true}
        width={450}
        height={275}
        handleClose={handleClose}
        open={true}>
        {!user.enabled && (
          <>
            <Info2 className={classes.modalTitle}>
              Enable {user.username}?
            </Info2>
            <P className={classes.info}>
              You are about to enable {user.username} into the system,
              activating previous eligible sessions and grant permissions to
              access the system.
            </P>
            <P className={classes.info}>Do you wish to proceed?</P>
          </>
        )}
        {user.enabled && (
          <>
            <Info2 className={classes.modalTitle}>
              Disable {user.username}?
            </Info2>
            <P className={classes.info}>
              You are about to disable {user.username} from the system,
              deactivating previous eligible sessions and removing permissions
              to access the system.
            </P>
            <P className={classes.info}>Do you wish to proceed?</P>
          </>
        )}
        <div className={classes.footer}>
          <Button className={classes.submit} onClick={() => submit()}>
            Confirm
          </Button>
        </div>
      </Modal>
    ))
  )
}

export default EnableUserModal
