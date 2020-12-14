import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import * as R from 'ramda'
import React, { useState, useEffect } from 'react'
import { CopyToClipboard as ReactCopyToClipboard } from 'react-copy-to-clipboard'

import Popover from 'src/components/Popper'
import { ReactComponent as CopyIcon } from 'src/styling/icons/action/copy/copy.svg'
import { comet } from 'src/styling/variables'

import { cpcStyles } from './Transactions.styles'

const useStyles = makeStyles(cpcStyles)

const CopyToClipboard = ({
  className,
  buttonClassname,
  children,
  wrapperClassname,
  ...props
}) => {
  const [anchorEl, setAnchorEl] = useState(null)

  useEffect(() => {
    if (anchorEl) setTimeout(() => setAnchorEl(null), 3000)
  }, [anchorEl])

  const classes = useStyles()

  const handleClick = event => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popper' : undefined

  return (
    <div className={classnames(classes.wrapper, wrapperClassname)}>
      {children && (
        <>
          <div className={classnames(classes.address, className)}>
            {children}
          </div>
          <div className={classnames(classes.buttonWrapper, buttonClassname)}>
            <ReactCopyToClipboard text={R.replace(/\s/g, '')(children)}>
              <button
                aria-describedby={id}
                onClick={event => handleClick(event)}>
                <CopyIcon />
              </button>
            </ReactCopyToClipboard>
          </div>
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            arrowSize={3}
            bgColor={comet}
            placement="top">
            <div className={classes.popoverContent}>
              <div>Copied to clipboard!</div>
            </div>
          </Popover>
        </>
      )}
    </div>
  )
}

export default CopyToClipboard
