import { Dialog, DialogContent, makeStyles } from '@material-ui/core'
import React, { memo } from 'react'

import { IconButton } from 'src/components/buttons'
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
      <Dialog open={open} aria-labelledby="form-dialog-title" {...props}>
        <DialogTitle id="customized-dialog-title" onClose={innerOnClose}>
          <H4>{title}</H4>
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          {data && <P>{data}</P>}
        </DialogContent>
      </Dialog>
    )
  }
)
