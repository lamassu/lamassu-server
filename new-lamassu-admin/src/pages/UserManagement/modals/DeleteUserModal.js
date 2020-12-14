import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { Info2, P } from 'src/components/typography'

import styles from '../UserManagement.styles'

const useStyles = makeStyles(styles)

const DeleteUserModal = ({
  showModal,
  toggleModal,
  user,
  confirm,
  inputConfirmToggle,
  setAction
}) => {
  const classes = useStyles()

  const handleClose = () => {
    toggleModal()
  }

  return (
    <>
      {showModal && (
        <Modal
          closeOnBackdropClick={true}
          width={600}
          height={275}
          handleClose={handleClose}
          open={true}>
          <Info2 className={classes.modalTitle}>Delete {user.username}?</Info2>
          <P className={classes.info}>
            You are about to delete {user.username}. This will remove existent
            sessions and revoke this user's permissions to access the system.
          </P>
          <P className={classes.info}>
            This is a <b>PERMANENT</b> operation. Do you wish to proceed?
          </P>
          <div className={classes.footer}>
            <Button
              className={classes.submit}
              onClick={() => {
                if (user.role === 'superuser') {
                  setAction(() =>
                    confirm.bind(null, {
                      variables: {
                        id: user.id
                      }
                    })
                  )
                  inputConfirmToggle()
                } else {
                  confirm({
                    variables: {
                      id: user.id
                    }
                  })
                }
                handleClose()
              }}>
              Confirm
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default DeleteUserModal
