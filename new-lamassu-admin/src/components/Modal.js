import { makeStyles, Modal as MaterialModal, Paper } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import { IconButton } from 'src/components/buttons'
import { H1, H4 } from 'src/components/typography'
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
    minHeight: height ?? 400,
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: 8,
    outline: 0
  }),
  infoPanelWrapper: ({ width, infoPanelHeight }) => ({
    width,
    height: infoPanelHeight,
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    minHeight: infoPanelHeight ?? 200,
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: 8,
    outline: 0
  }),
  panelContent: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: [[0, 24]]
  },
  content: ({ small, xl }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: xl ? [[0, 60 + 28]] : small ? [[0, 16]] : [[0, 32]]
  }),
  button: ({ small, xl }) => ({
    padding: [[0, 0, xl ? 26 : 0, 0]],
    margin: xl
      ? [[0, 0, 'auto', 'auto']]
      : small
      ? [[12, 12, 'auto', 'auto']]
      : [[16, 16, 'auto', 'auto']]
  }),
  header: {
    display: 'flex'
  },
  title: ({ small }) => ({
    margin: small ? [[20, 0, 8, 16]] : [[28, 0, 8, 32]]
  })
}

const useStyles = makeStyles(styles)

const Modal = ({
  width,
  height,
  infoPanelHeight,
  title,
  small,
  xl,
  infoPanel,
  handleClose,
  children,
  secondaryModal,
  className,
  closeOnEscape,
  closeOnBackdropClick,
  ...props
}) => {
  const classes = useStyles({ width, height, small, infoPanelHeight, xl })
  const TitleCase = small ? H4 : H1
  const closeSize = xl ? 28 : small ? 16 : 20

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
          <Paper className={classnames(classes.infoPanelWrapper, className)}>
            <div className={classes.panelContent}>{infoPanel}</div>
          </Paper>
        )}
      </>
    </MaterialModal>
  )
}

export default Modal
