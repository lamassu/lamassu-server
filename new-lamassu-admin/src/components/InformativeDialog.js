import { Dialog, DialogContent, makeStyles } from '@material-ui/core'
import React, { memo } from 'react'

import { IconButton } from 'src/components/buttons'
import { H2 } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { spacer } from 'src/styling/variables'

const useStyles = makeStyles({
  closeButton: {
    display: 'flex',
    padding: [[spacer * 2, spacer * 2, 0, spacer * 2]],
    paddingRight: spacer * 1.5,
    justifyContent: 'end'
  },
  title: {
    margin: [[0, spacer * 2, spacer * 2, spacer * 2 + 4]]
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

export const InformativeDialog = memo(
  ({ title = '', open, onDissmised, disabled = false, data, ...props }) => {
    const classes = useStyles()

    const innerOnClose = () => {
      onDissmised()
    }

    return (
      <Dialog
        fullWidth
        open={open}
        aria-labelledby="form-dialog-title"
        {...props}>
        <div className={classes.closeButton}>
          <IconButton size={16} aria-label="close" onClick={innerOnClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <H2 className={classes.title}>{title}</H2>
        <DialogContent className={classes.dialogContent}>{data}</DialogContent>
      </Dialog>
    )
  }
)
