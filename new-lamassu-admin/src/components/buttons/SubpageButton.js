import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo, useState } from 'react'

import { H4 } from 'src/components/typography'
import { ReactComponent as CancelIconInverse } from 'src/styling/icons/button/cancel/white.svg'

import subpageButtonStyles from './SubpageButton.styles'

const useStyles = makeStyles(subpageButtonStyles)

const SubpageButton = memo(
  ({
    className,
    Icon,
    InverseIcon,
    toggle,
    forceDisable = false,
    children
  }) => {
    const [active, setActive] = useState(false)
    const isActive = forceDisable ? false : active
    const classes = useStyles()
    const classNames = {
      [classes.button]: true,
      [classes.normalButton]: !isActive,
      [classes.activeButton]: isActive
    }

    const normalButton = <Icon className={classes.buttonIcon} />

    const activeButton = (
      <>
        <InverseIcon
          className={classnames(
            classes.buttonIcon,
            classes.buttonIconActiveLeft
          )}
        />
        <H4 className={classes.white}>{children}</H4>
        <CancelIconInverse
          className={classnames(
            classes.buttonIcon,
            classes.buttonIconActiveRight
          )}
        />
      </>
    )

    const innerToggle = () => {
      forceDisable = false
      const newActiveState = !isActive
      toggle(newActiveState)
      setActive(newActiveState)
    }

    return (
      <button
        className={classnames(classNames, className)}
        onClick={innerToggle}>
        {isActive ? activeButton : normalButton}
      </button>
    )
  }
)

export default SubpageButton
