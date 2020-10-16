import { makeStyles, ClickAwayListener } from '@material-ui/core'
import classnames from 'classnames'
import React, { memo, useState } from 'react'

import Popper from 'src/components/Popper'
import { FeatureButton } from 'src/components/buttons'
import { ReactComponent as ZoomIconInverse } from 'src/styling/icons/circle buttons/search/white.svg'
import { ReactComponent as ZoomIcon } from 'src/styling/icons/circle buttons/search/zodiac.svg'

import imagePopperStyles from './ImagePopper.styles'

const useStyles = makeStyles(imagePopperStyles)

const ImagePopper = memo(({ className, width, height, src }) => {
  const classes = useStyles({ width, height })
  const [popperAnchorEl, setPopperAnchorEl] = useState(null)

  const handleOpenPopper = event => {
    setPopperAnchorEl(popperAnchorEl ? null : event.currentTarget)
  }

  const handleClosePopper = () => {
    setPopperAnchorEl(null)
  }

  const popperOpen = Boolean(popperAnchorEl)

  const Image = ({ className }) => (
    <img className={classnames(className)} src={src} alt="" />
  )

  return (
    <ClickAwayListener onClickAway={handleClosePopper}>
      <div className={classnames(classes.row, className)}>
        <Image className={classes.unzoomedImg} />
        <FeatureButton
          Icon={ZoomIcon}
          InverseIcon={ZoomIconInverse}
          className={classes.button}
          onClick={handleOpenPopper}
        />
        <Popper open={popperOpen} anchorEl={popperAnchorEl} placement="top">
          <div className={classes.popoverContent}>
            <Image />
          </div>
        </Popper>
      </div>
    </ClickAwayListener>
  )
})

export default ImagePopper
