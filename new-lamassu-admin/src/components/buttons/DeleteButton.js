import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo } from 'react'

import typographyStyles from 'src/components/typography/styles'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/button/cancel/zodiac.svg'
import { zircon, zircon2, comet, fontColor, white } from 'src/styling/variables'

const { p } = typographyStyles

const styles = {
  button: {
    extend: p,
    border: 'none',
    backgroundColor: zircon,
    cursor: 'pointer',
    outline: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 167,
    height: 48,
    color: fontColor,
    '&:hover': {
      backgroundColor: zircon2
    },
    '&:active': {
      backgroundColor: comet,
      color: white,
      '& svg g *': {
        stroke: white
      }
    },
    '& svg': {
      marginRight: 8
    }
  }
}

const useStyles = makeStyles(styles)

const SimpleButton = memo(({ className, children, ...props }) => {
  const classes = useStyles()

  return (
    <button className={classnames(classes.button, className)} {...props}>
      <DeleteIcon />
      {children}
    </button>
  )
})

export default SimpleButton
