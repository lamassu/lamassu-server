import { makeStyles, Modal as MaterialModal, Paper } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import { IconButton } from 'src/components/buttons'
import { H1, H2 } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'

const styles = {
  modal: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center'
  },
  wrapper: ({ width, height }) => ({
    width,
    height,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 400,
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: 8,
    outline: 0
  }),
  content: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: [[0, 32]]
  },
  button: {
    padding: 0,
    margin: [[20, 20, 'auto', 'auto']]
  },
  header: {
    display: 'flex'
  },
  title: {
    margin: [[28, 0, 8, 32]]
  }
}

const useStyles = makeStyles(styles)

const Modal = ({
  width,
  height,
  title,
  titleSmall,
  infoPanel,
  handleClose,
  children,
  className,
  closeOnEscape,
  closeOnBackdropClick,
  ...props
}) => {
  const classes = useStyles({ width, height })
  const TitleCase = titleSmall ? H2 : H1
  const closeSize = titleSmall ? 16 : 20

  const innerClose = (evt, reason) => {
    if (!closeOnBackdropClick && reason === 'backdropClick') return
    if (!closeOnEscape && reason === 'escapeKeyDown') return
    handleClose()
  }

  return (
    <MaterialModal onClose={innerClose} className={classes.modal} {...props}>
      <>
        <Paper className={classnames(classes.wrapper, className)}>
          <div className={classes.header}>
            {title && <TitleCase className={classes.title}>{title}</TitleCase>}
            <IconButton
              size={closeSize}
              className={classes.button}
              onClick={() => handleClose()}>
              <CloseIcon />
            </IconButton>
          </div>
          <div className={classes.content}>{children}</div>
        </Paper>
        {infoPanel && (
          <Paper className={classnames(classes.wrapper, className)}>
            {infoPanel}
          </Paper>
        )}
      </>
    </MaterialModal>
  )
}

export default Modal
