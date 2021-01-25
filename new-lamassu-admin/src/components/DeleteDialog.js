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

const useStyles = makeStyles({
  dialogContent: {
    width: 434,
    padding: spacer * 2,
    paddingRight: spacer * 3.5
  },
  dialogTitle: {
    padding: spacer * 2,
    paddingRight: spacer * 1.5,
    display: 'flex',
    'justify-content': 'space-between',
    '& > h4': {
      margin: 0
    },
    '& > button': {
      padding: 0,
      marginTop: -(spacer / 2)
    }
  },
  dialogActions: {
    padding: spacer * 4,
    paddingTop: spacer * 2
  }
})

export const DialogTitle = ({ children, close }) => {
  const classes = useStyles()
  return (
    <div className={classes.dialogTitle}>
      {children}
      {
        <IconButton size={16} aria-label="close" onClick={close}>
          <CloseIcon />
        </IconButton>
      }
    </div>
  )
}

export const DeleteDialog = ({
  title = 'Confirm Delete',
  open = false,
  setDeleteDialog,
  onConfirmed,
  item = 'item',
  confirmationMessage = `Are you sure you want to delete this ${item}?`
}) => {
  const classes = useStyles()

  return (
    <Dialog open={open} aria-labelledby="form-dialog-title">
      <DialogTitle close={() => setDeleteDialog(false)}>
        <H4>{title}</H4>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        {confirmationMessage && <P>{confirmationMessage}</P>}
      </DialogContent>
      <DialogActions className={classes.dialogActions}>
        <Button onClick={onConfirmed}>Confirm</Button>
      </DialogActions>
    </Dialog>
  )
}
