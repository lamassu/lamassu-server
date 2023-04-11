import { Paper, ClickAwayListener } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import React, { memo, useState } from 'react'

import { TL2, Label1 } from '../typography'

import Link from './Link'
import styles from './LinkDropdown.styles'

const useStyles = makeStyles(styles)

const LinkDropdown = memo(({ options = [], ...props }) => {
  const classes = useStyles({ x: 50, y: 50 })
  const [isOpen, setOpen] = useState(false)

  const onClick = e => {
    if (props.onClick) props.onClick(e)
    setOpen(!isOpen)
  }

  const onItemClick = it => {
    setOpen(false)
    if (props.onItemClick) props.onItemClick(it)
  }

  return (
    <div className={classes.wrapper}>
      <Link {...props} onClick={onClick} />
      {isOpen && (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper className={classes.optionList}>
            {options.map(it => (
              <div className={classes.option} onClick={() => onItemClick(it)}>
                <TL2 noMargin>{`${it.name}`}</TL2>
                <Label1 noMargin>{`${it.category}`}</Label1>
              </div>
            ))}
          </Paper>
        </ClickAwayListener>
      )}
    </div>
  )
})

export default LinkDropdown
