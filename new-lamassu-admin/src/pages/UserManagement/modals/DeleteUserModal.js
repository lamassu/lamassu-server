import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { H2, Info3 } from 'src/components/typography'

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
          <H2 className={classes.modalTitle}>Delete {user.username}?</H2>
          <Info3 className={classes.info}>
            You are about to delete {user.username}. This will remove existent
            sessions and revoke this user's permissions to access the system.
          </Info3>
          <Info3 className={classes.info}>
            This is a <b>PERMANENT</b> operation. Do you wish to proceed?
          </Info3>
          <div className={classes.footer}>
            <Button
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
              Finish
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default DeleteUserModal
