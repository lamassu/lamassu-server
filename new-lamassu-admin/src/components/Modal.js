import { makeStyles, Modal as MaterialModal, Paper } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'

const styles = {
  modal: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContentWrapper: {
    display: 'flex',
    position: 'relative',
    minHeight: 400,
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: 8,
    outline: 0,
    '& > div': {
      width: '100%'
    }
  },
  closeIcon: {
    position: 'absolute',
    width: 18,
    height: 18,
    padding: 0,
    top: 20,
    right: 20
  }
}

const useStyles = makeStyles(styles)

const Modal = ({ handleClose, children, className, ...props }) => {
  const classes = useStyles()

  return (
    <MaterialModal onClose={handleClose} className={classes.modal} {...props}>
      <Paper className={classnames(classes.modalContentWrapper, className)}>
        <button
          className={classnames(classes.iconButton, classes.closeIcon)}
          onClick={() => handleClose()}>
          <CloseIcon />
        </button>
        {children}
      </Paper>
    </MaterialModal>
  )
}

export default Modal
