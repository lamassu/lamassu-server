import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import Modal from 'src/components/Modal'
import { H2, Info3, Mono } from 'src/components/typography'
import CopyToClipboard from 'src/pages/Transactions/CopyToClipboard'

import styles from '../UserManagement.styles'

const useStyles = makeStyles(styles)

const ResetPasswordModal = ({
  showModal,
  toggleModal,
  resetPasswordURL,
  user
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
          <H2 className={classes.modalTitle}>
            Reset password for {user.username}
          </H2>
          <Info3 className={classes.info}>
            Safely share this link with {user.username} for a password reset.
          </Info3>
          <div className={classes.addressWrapper}>
            <Mono className={classes.address}>
              <strong>
                <CopyToClipboard buttonClassname={classes.copyToClipboard}>
                  {resetPasswordURL}
                </CopyToClipboard>
              </strong>
            </Mono>
          </div>
        </Modal>
      )}
    </>
  )
}

export default ResetPasswordModal
