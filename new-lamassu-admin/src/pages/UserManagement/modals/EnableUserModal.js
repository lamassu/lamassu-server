import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { H2, Info3 } from 'src/components/typography'

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
    <>
      {showModal && (
        <Modal
          closeOnBackdropClick={true}
          width={600}
          height={275}
          handleClose={handleClose}
          open={true}>
          {!user.enabled && (
            <>
              <H2 className={classes.modalTitle}>Enable {user.username}?</H2>
              <Info3 className={classes.info}>
                You are about to enable {user.username} into the system,
                activating previous eligible sessions and grant permissions to
                access the system.
              </Info3>
              <Info3 className={classes.info}>Do you wish to proceed?</Info3>
            </>
          )}
          {user.enabled && (
            <>
              <H2 className={classes.modalTitle}>Disable {user.username}?</H2>
              <Info3 className={classes.info}>
                You are about to disable {user.username} from the system,
                deactivating previous eligible sessions and removing permissions
                to access the system.
              </Info3>
              <Info3 className={classes.info}>Do you wish to proceed?</Info3>
            </>
          )}
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

export default EnableUserModal
