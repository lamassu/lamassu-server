import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import Modal from 'src/components/Modal'
import { Info2, P, Mono } from 'src/components/typography'
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
          width={500}
          height={180}
          handleClose={handleClose}
          open={true}>
          <Info2 className={classes.modalTitle}>
            Reset password for {user.username}
          </Info2>
          <P className={classes.info}>
            Safely share this link with {user.username} for a password reset.
          </P>
          <div className={classes.addressWrapper}>
            <Mono className={classes.address}>
              <strong>
                <CopyToClipboard
                  className={classes.link}
                  buttonClassname={classes.copyToClipboard}
                  wrapperClassname={classes.test1}>
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
