import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo, useState } from 'react'

import { ReactComponent as CancelIconInverse } from 'src/styling/icons/button/cancel/white.svg'

import subpageButtonStyles from './SubpageButton.styles'

const useStyles = makeStyles(subpageButtonStyles)

const SubpageButton = memo(
  ({ className, Icon, InverseIcon, toggle, children }) => {
    const [active, setActive] = useState(false)

    const classes = useStyles()

    const classNames = {
      [classes.button]: true,
      [classes.normalButton]: !active,
      [classes.activeButton]: active
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
        {children}
        <CancelIconInverse
          className={classnames(
            classes.buttonIcon,
            classes.buttonIconActiveRight
          )}
        />
      </>
    )

    const innerToggle = () => {
      const newActiveState = !active
      toggle(newActiveState)
      setActive(newActiveState)
    }

    return (
      <button
        className={classnames(classNames, className)}
        onClick={innerToggle}>
        {active ? activeButton : normalButton}
      </button>
    )
  }
)

export default SubpageButton
