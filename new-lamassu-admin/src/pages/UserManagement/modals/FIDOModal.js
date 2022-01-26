import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { Info2, P } from 'src/components/typography'

import styles from '../UserManagement.styles'

const useStyles = makeStyles(styles)

const ChangeRoleModal = ({ state, dispatch }) => {
  const classes = useStyles()

  const handleClose = () => {
    dispatch({
      type: 'close',
      payload: 'showFIDOModal'
    })
  }

  return (
    <Modal
      closeOnBackdropClick={true}
      width={450}
      height={275}
      handleClose={handleClose}
      open={state.showFIDOModal}>
      <Info2 className={classes.modalTitle}>About FIDO authentication</Info2>
      <P className={classes.info}>
        This feature is only available for websites with configured domains, and
        we detected that a domain is not configured at the moment.
      </P>
      <P>
        Make sure that a domain is configured for this website and try again
        later.
      </P>
      <div className={classes.footer}>
        <Button className={classes.submit} onClick={() => handleClose()}>
          Confirm
        </Button>
      </div>
    </Modal>
  )
}

export default ChangeRoleModal
