import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { H2, Info3 } from 'src/components/typography'

import styles from '../UserManagement.styles'

const useStyles = makeStyles(styles)

const ChangeRoleModal = ({
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
          <H2 className={classes.modalTitle}>Change {user.username}'s role?</H2>
          <Info3 className={classes.info}>
            You are about to alter {user.username}'s role. This will change this
            user's permission to access certain resources.
          </Info3>
          <Info3 className={classes.info}>Do you wish to proceed?</Info3>
          <div className={classes.footer}>
            <Button
              onClick={() => {
                setAction(() =>
                  confirm.bind(null, {
                    variables: {
                      id: user.id,
                      newRole: user.role === 'superuser' ? 'user' : 'superuser'
                    }
                  })
                )
                inputConfirmToggle()
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

export default ChangeRoleModal
