import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  makeStyles
} from '@material-ui/core'
import React, { useEffect, useState, memo } from 'react'

import { Button, IconButton } from 'src/components/buttons'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'

import Tooltip from './Tooltip'
import { TextInput } from './inputs'
import { H4, P } from './typography'

const useStyles = makeStyles({
  label: {
    fontSize: 16
  },
  spacing: {
    padding: 32
  },
  wrapper: {
    display: 'flex'
  },
  title: {
    margin: [[20, 0, 24, 16]]
  },
  closeButton: {
    padding: 0,
    margin: [[12, 12, 'auto', 'auto']]
    // position: 'absolute',
    // right: spacer,
    // top: spacer
  }
})

export const DialogTitle = ({ children, onClose }) => {
  const classes = useStyles()
  return (
    <div className={classes.wrapper}>
      {children}
      {onClose && (
        <Tooltip
          className={classes.closeButton}
          enableOver
          element={
            <IconButton size={16} aria-label="close" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          }>
          <P>Close</P>
        </Tooltip>
      )}
    </div>
  )
}

export const ConfirmDialog = memo(
  ({
    title = 'Confirm action',
    subtitle = 'This action requires confirmation',
    open,
    toBeConfirmed,
    onConfirmed,
    onDissmised,
    className,
    ...props
  }) => {
    const classes = useStyles()
    const [value, setValue] = useState('')
    useEffect(() => setValue(''), [open])
    const handleChange = event => {
      setValue(event.target.value)
    }

    return (
      <Dialog open={open} aria-labelledby="form-dialog-title" {...props}>
        <DialogTitle id="customized-dialog-title" onClose={onDissmised}>
          <H4 className={classes.title}>{title}</H4>
          {subtitle && (
            <DialogContentText>
              <P>{subtitle}</P>
            </DialogContentText>
          )}
        </DialogTitle>
        <DialogContent className={className}>
          <TextInput
            label={`Write '${toBeConfirmed}' to confirm`}
            name="confirm-input"
            autoFocus
            id="confirm-input"
            type="text"
            size="lg"
            fullWidth
            value={value}
            touched={{}}
            error={toBeConfirmed !== value}
            InputLabelProps={{ shrink: true, className: classes.label }}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions classes={{ spacing: classes.spacing }}>
          <Button
            color="green"
            disabled={toBeConfirmed !== value}
            onClick={onConfirmed}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
)
