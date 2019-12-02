import React, { useState, useEffect } from 'react'
import classnames from 'classnames'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { replace } from 'lodash/fp'
import { makeStyles } from '@material-ui/core/styles'

import { addressStyles } from './Transactions.styles'

import Popover from '../../components/Popper'
import { ReactComponent as CopyIcon } from '../../styling/icons/action/copy/copy.svg'
import { comet } from '../../styling/variables'

const Address = ({ className, type, children, ...props }) => {
  const [anchorEl, setAnchorEl] = useState(null)

  useEffect(() => {
    if (anchorEl) setTimeout(() => setAnchorEl(null), 3000)
  }, [anchorEl])

  const useStyles = makeStyles(addressStyles)

  const classes = useStyles()

  const addrClasses = {
    [classes.address]: true,
    [classes.btcAddr]: type === 'btc',
    [classes.txId]: type === 'txId',
    [classes.sessionId]: type === 'sessionId'
  }

  const handleClick = event => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popper' : undefined

  return (
    <div className={classnames(classes.wrapper, className)}>
      {children && (
        <>
          <div className={classnames(addrClasses)}>{children}</div>
          <div className={classes.buttonWrapper}>
            <CopyToClipboard
              text={replace(/\s/g, '')(children)}
            >
              <button aria-describedby={id} onClick={(event) => handleClick(event)}><CopyIcon /></button>
            </CopyToClipboard>
          </div>
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            arrowSize={3}
            bgColor={comet}
            placement='top'
          >
            <div className={classes.popoverContent}>
              <div>Copied to clipboard!</div>
            </div>
          </Popover>
        </>
      )}
    </div>
  )
}

export default Address
