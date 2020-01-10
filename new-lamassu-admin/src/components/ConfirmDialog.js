import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle as MuiDialogTitle,
  IconButton
} from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import React, { memo } from 'react'

import { Button } from '../components/buttons'
import { ReactComponent as CloseIcon } from '../styling/icons/action/close/zodiac.svg'
import { spacer } from '../styling/variables'

import { TextInput } from './inputs'
import { H4, P } from './typography'

const styles = () => ({
  closeButton: {
    position: 'absolute',
    right: spacer,
    top: spacer
  }
})

const DialogTitle = withStyles(styles)(props => {
  const { children, classes, onClose } = props
  return (
    <MuiDialogTitle>
      {children}
      {onClose && (
        <IconButton
          aria-label="close"
          className={classes.closeButton}
          onClick={onClose}>
          <CloseIcon />
        </IconButton>
      )}
    </MuiDialogTitle>
  )
})

const ConfirmDialog = memo(
  ({
    title = 'Confirm action',
    subtitle = 'This action requires confirmation',
    open,
    toBeConfirmed,
    onConfirmed,
    onDissmised,
    ...props
  }) => {
    const [value, setValue] = React.useState('')
    const [isOpen, setOpen] = React.useState(open)

    const handleChange = event => {
      setValue(event.target.value)
    }

    const handleConfirmed = () => {
      setOpen(false)
      onConfirmed()
    }

    const handleDissmised = () => {
      setOpen(false)
      onDissmised()
    }

    return (
      <Dialog open={isOpen} aria-labelledby="form-dialog-title" {...props}>
        <DialogTitle id="customized-dialog-title" onClose={handleDissmised}>
          <H4>{title}</H4>
          {subtitle && (
            <DialogContentText>
              <P>{subtitle}</P>
            </DialogContentText>
          )}
        </DialogTitle>
        <DialogContent>
          <TextInput
            label={`Write '${toBeConfirmed}' to confirm`}
            name="confirm-input"
            autoFocus
            id="confirm-input"
            type="text"
            large
            fullWidth
            value={value}
            touched={{}}
            error={toBeConfirmed !== value}
            InputLabelProps={{ shrink: true }}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button
            color="green"
            disabled={toBeConfirmed !== value}
            onClick={handleConfirmed}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
)

export default ConfirmDialog
