import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import React, { useState } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { Info2, P } from 'src/components/typography'

import styles from '../UserManagement.styles'

import Input2FAModal from './Input2FAModal'

const CHANGE_USER_ROLE = gql`
  mutation changeUserRole(
    $confirmationCode: String
    $id: ID!
    $newRole: String!
  ) {
    changeUserRole(
      confirmationCode: $confirmationCode
      id: $id
      newRole: $newRole
    ) {
      id
    }
  }
`

const useStyles = makeStyles(styles)

const ChangeRoleModal = ({ state, dispatch, user, requiresConfirmation }) => {
  const classes = useStyles()

  const [changeUserRole, { error }] = useMutation(CHANGE_USER_ROLE, {
    onCompleted: () => handleClose(),
    refetchQueries: () => ['users']
  })

  const [confirmation, setConfirmation] = useState(null)

  const submit = () => {
    changeUserRole({
      variables: {
        confirmationCode: confirmation,
        id: user.id,
        newRole: user.role === 'superuser' ? 'user' : 'superuser'
      }
    })
  }

  const handleClose = () => {
    setConfirmation(null)
    dispatch({
      type: 'close',
      payload: 'showRoleModal'
    })
  }

  return (
    (state.showRoleModal && requiresConfirmation && !confirmation && (
      <Input2FAModal
        showModal={state.showRoleModal}
        handleClose={handleClose}
        setConfirmation={setConfirmation}
      />
    )) ||
    (state.showRoleModal && (
      <Modal
        closeOnBackdropClick={true}
        width={450}
        height={250}
        handleClose={handleClose}
        open={true}>
        <Info2 className={classes.modalTitle}>
          Change {user.username}'s role?
        </Info2>
        <P className={classes.info}>
          You are about to alter {user.username}'s role. This will change this
          user's permission to access certain resources.
        </P>
        <P className={classes.info}>Do you wish to proceed?</P>
        <div className={classes.footer}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button className={classes.submit} onClick={() => submit()}>
            Confirm
          </Button>
        </div>
      </Modal>
    ))
  )
}

export default ChangeRoleModal
