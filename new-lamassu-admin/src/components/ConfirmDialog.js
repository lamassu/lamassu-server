import React, { memo } from 'react'
import { DialogActions, DialogContent, DialogContentText, IconButton, Dialog, DialogTitle as MuiDialogTitle } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { Button } from '../components/buttons'
import { TextInput } from './inputs'
import { H4, P } from './typography'
import { ReactComponent as CloseIcon } from '../styling/icons/action/close/zodiac.svg'

const styles = theme => ({
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1)
  }
})

const DialogTitle = withStyles(styles)(props => {
  const { children, classes, onClose } = props
  return (
    <MuiDialogTitle>
      {children}

      {onClose ? (
        <IconButton aria-label='close' className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  )
})

const ConfirmDialog = memo(({ title = 'Confirm action', subtitle = 'This action requires confirmation', open, toBeConfirmed, onConfirmed, onDissmised, ...props }) => {
  const [value, setValue] = React.useState('')
  const [_open, setOpen] = React.useState(open)

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
    <Dialog open={_open} aria-labelledby='form-dialog-title' {...props}>
      <DialogTitle id='customized-dialog-title' onClose={handleDissmised}>
        <H4>{title}</H4>
        {subtitle && <DialogContentText><P>{subtitle}</P></DialogContentText>}
      </DialogTitle>
      <DialogContent>

        <TextInput
          label={`Write '${toBeConfirmed}' to confirm`}
          name='confirm-input'
          autoFocus
          id='confirm-input'
          type='text'
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
        <Button color='green' disabled={toBeConfirmed !== value} onClick={handleConfirmed}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
})

export default ConfirmDialog
