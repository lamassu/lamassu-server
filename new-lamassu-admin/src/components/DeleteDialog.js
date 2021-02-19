import {
  Dialog,
  DialogActions,
  DialogContent,
  makeStyles
} from '@material-ui/core'
import React from 'react'

import { Button, IconButton } from 'src/components/buttons'
import { H4, P } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { spacer } from 'src/styling/variables'

import ErrorMessage from './ErrorMessage'

const useStyles = makeStyles({
  content: {
    width: 434,
    padding: spacer * 2,
    paddingRight: spacer * 3.5
  },
  titleSection: {
    padding: spacer * 2,
    paddingRight: spacer * 1.5,
    display: 'flex',
    justifyContent: 'space-between',
    margin: 0
  },
  actions: {
    padding: spacer * 4,
    paddingTop: spacer * 2
  },
  title: {
    margin: 0
  },
  closeButton: {
    padding: 0,
    marginTop: -(spacer / 2)
  }
})

export const DialogTitle = ({ children, close }) => {
  const classes = useStyles()
  return (
    <div className={classes.titleSection}>
      {children}
      {close && (
        <IconButton
          size={16}
          aria-label="close"
          onClick={close}
          className={classes.closeButton}>
          <CloseIcon />
        </IconButton>
      )}
    </div>
  )
}

export const DeleteDialog = ({
  title = 'Confirm Delete',
  open = false,
  onConfirmed,
  onDismissed,
  item = 'item',
  confirmationMessage = `Are you sure you want to delete this ${item}?`,
  errorMessage = ''
}) => {
  const classes = useStyles()

  return (
    <Dialog open={open} aria-labelledby="form-dialog-title">
      <DialogTitle close={() => onDismissed()}>
        <H4 className={classes.title}>{title}</H4>
      </DialogTitle>
      {errorMessage && (
        <DialogTitle>
          <ErrorMessage>
            {errorMessage.split(':').map(error => (
              <>
                {error}
                <br />
              </>
            ))}
          </ErrorMessage>
        </DialogTitle>
      )}
      <DialogContent className={classes.content}>
        {confirmationMessage && <P>{confirmationMessage}</P>}
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button onClick={onConfirmed}>Confirm</Button>
      </DialogActions>
    </Dialog>
  )
}
