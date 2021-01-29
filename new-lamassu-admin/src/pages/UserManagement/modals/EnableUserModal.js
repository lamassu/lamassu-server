import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { Info2, P } from 'src/components/typography'

import styles from '../UserManagement.styles'

const useStyles = makeStyles(styles)

const EnableUserModal = ({
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
    )
  )
}

export default EnableUserModal
