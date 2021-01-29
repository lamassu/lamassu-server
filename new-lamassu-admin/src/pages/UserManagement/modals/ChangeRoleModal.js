import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { Info2, P } from 'src/components/typography'

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
    showModal && (
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
          <Button
            className={classes.submit}
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
            Confirm
          </Button>
        </div>
      </Modal>
    )
  )
}

export default ChangeRoleModal
