import { makeStyles, Modal as MaterialModal, Paper } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import { IconButton } from 'src/components/buttons'
import { H1, H4, P } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'

import Tooltip from './Tooltip'

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
  content: ({ small }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: small ? [[0, 16]] : [[0, 32]]
  }),
  button: ({ small }) => ({
    padding: 0,
    margin: small ? [[12, 12, 'auto', 'auto']] : [[16, 16, 'auto', 'auto']]
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
  title,
  small,
  infoPanel,
  handleClose,
  children,
  className,
  closeOnEscape,
  closeOnBackdropClick,
  ...props
}) => {
  const classes = useStyles({ width, height, small })
  const TitleCase = small ? H4 : H1
  const closeSize = small ? 16 : 20

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
            <Tooltip
              enableOver
              className={classes.button}
              element={
                <IconButton size={closeSize} onClick={() => handleClose()}>
                  <CloseIcon />
                </IconButton>
              }>
              <P>Close</P>
            </Tooltip>
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
