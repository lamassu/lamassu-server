import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import { primaryColor, spring2, spring3, disabledColor } from '../../styling/variables'
import typographyStyles from '../typography/styles'

const { label1 } = typographyStyles

const styles = {
  wrapper: {
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  button: {
    extend: label1,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: primaryColor,
    zIndex: 2
  },
  lowerBound: {
    left: '50%'
  },
  upperBound: {
    right: '50%'
  },
  selected: {
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: spring2,
    borderRadius: '50%',
    position: 'absolute',
    zIndex: 1
  },
  between: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
    backgroundColor: spring3
  },
  disabled: {
    color: disabledColor,
    cursor: 'default'
  }
}

const useStyles = makeStyles(styles)

const Tile = ({ isLowerBound, isUpperBound, isBetween, isDisabled, children, ...props }) => {
  const classes = useStyles()
  const selected = isLowerBound || isUpperBound

  const rangeClasses = {
    [classes.between]: isBetween && !(isLowerBound && isUpperBound),
    [classes.lowerBound]: isLowerBound && !isUpperBound,
    [classes.upperBound]: isUpperBound && !isLowerBound
  }

  const buttonWrapperClasses = {
    [classes.wrapper]: true,
    [classes.selected]: selected
  }

  const buttonClasses = {
    [classes.button]: true,
    [classes.disabled]: isDisabled
  }

  return (
    <div className={classes.wrapper}>
      <div className={classnames(rangeClasses)} />
      <div className={classnames(buttonWrapperClasses)}>
        <button className={classnames(buttonClasses)}>
          {children}
        </button>
      </div>
    </div>
  )
}

export default Tile
