import {
  Dialog,
  DialogActions,
  DialogContent,
  makeStyles,
  InputLabel
} from '@material-ui/core'
import React, { memo, useState } from 'react'

import { Button, IconButton } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs'
import { H4, P } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { spacer } from 'src/styling/variables'

import ErrorMessage from './ErrorMessage'

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

export const DialogTitle = ({ children, onClose }) => {
  const classes = useStyles()
  return (
    <div className={classes.dialogTitle}>
      {children}
      {onClose && (
        <IconButton size={16} aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      )}
    </div>
  )
}

export const ConfirmDialog = memo(
  ({
    title = 'Confirm action',
    errorMessage = 'This action requires confirmation',
    open,
    toBeConfirmed,
    saveButtonAlwaysEnabled = false,
    message,
    confirmationMessage = `Write '${toBeConfirmed}' to confirm this action`,
    onConfirmed,
    onDissmised,
    initialValue = '',
    disabled = false,
    ...props
  }) => {
    const classes = useStyles()
    const [value, setValue] = useState(initialValue)
    const [error, setError] = useState(false)
    const handleChange = event => setValue(event.target.value)

    const innerOnClose = () => {
      setValue('')
      setError(false)
      onDissmised()
    }

    const isOnErrorState =
      (!saveButtonAlwaysEnabled && toBeConfirmed !== value) || value === ''

    return (
      <Dialog open={open} aria-labelledby="form-dialog-title" {...props}>
        <DialogTitle id="customized-dialog-title" onClose={innerOnClose}>
          <H4>{title}</H4>
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
        <DialogContent className={classes.dialogContent}>
          {message && <P>{message}</P>}
          <InputLabel htmlFor="confirm-input">{confirmationMessage}</InputLabel>
          <TextInput
            disabled={disabled}
            name="confirm-input"
            autoFocus
            id="confirm-input"
            type="text"
            size="sm"
            fullWidth
            value={value}
            touched={{}}
            error={error}
            InputLabelProps={{ shrink: true }}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions className={classes.dialogActions}>
          <Button
            color="green"
            disabled={isOnErrorState}
            onClick={() => onConfirmed(value)}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
)
