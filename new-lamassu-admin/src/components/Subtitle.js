import React, { memo } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import { TL1 } from './typography'
import { spacer, offColor } from '../styling/variables'

const useStyles = makeStyles({
  subtitle: {
    color: offColor,
    marginTop: spacer * 2,
    marginBottom: spacer * 2
  },
  extraMarginTop: {
    marginTop: spacer * 9
  }
})

const Subtitle = memo(({ children, className, extraMarginTop }) => {
  const classes = useStyles()
  const classNames = {
    [classes.subtitle]: true,
    [classes.extraMarginTop]: extraMarginTop
  }

  return (<TL1 className={classnames(classNames, className)}>{children}</TL1>)
})

export default Subtitle
