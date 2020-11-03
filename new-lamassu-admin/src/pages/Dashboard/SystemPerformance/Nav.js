import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { useState } from 'react'

import { H4 } from 'src/components/typography'

import styles from './SystemPerformance.styles'
const useStyles = makeStyles(styles)

const Nav = ({ handleSetRange }) => {
  const classes = useStyles()
  const [clickedItem, setClickedItem] = useState('24 hours')

  const isSelected = innerText => {
    return innerText === clickedItem
  }

  const handleClick = range => {
    setClickedItem(range)
    handleSetRange(range)
  }

  return (
    <div className={classnames(classes.titleWrapper)}>
      <div className={classes.titleAndButtonsContainer}>
        <H4 className={classes.h4}>{'System performance'}</H4>
      </div>

      <Button
        onClick={e => handleClick(e.target.innerText)}
        size="small"
        disableRipple
        disableFocusRipple
        className={
          isSelected('All time') ? classes.highlightedLabel : classes.label
        }>
        All time
      </Button>
      <Button
        onClick={e => handleClick(e.target.innerText)}
        size="small"
        disableRipple
        disableFocusRipple
        className={
          isSelected('180 days') ? classes.highlightedLabel : classes.label
        }>
        180 days
      </Button>
      <Button
        onClick={e => handleClick(e.target.innerText)}
        size="small"
        disableRipple
        disableFocusRipple
        className={
          isSelected('30 days') ? classes.highlightedLabel : classes.label
        }>
        30 days
      </Button>
      <Button
        onClick={e => handleClick(e.target.innerText)}
        size="small"
        disableRipple
        disableFocusRipple
        className={
          isSelected('7 days') ? classes.highlightedLabel : classes.label
        }>
        7 days
      </Button>
      <Button
        size="small"
        disableRipple
        disableFocusRipple
        className={
          isSelected('24 hours') ? classes.highlightedLabel : classes.label
        }
        onClick={e => handleClick(e.target.innerText)}>
        24 hours
      </Button>
    </div>
  )
}

export default Nav
