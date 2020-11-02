import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { useState } from 'react'

import { H4 } from 'src/components/typography'

import styles from './SystemPerformance.styles'
const useStyles = makeStyles(styles)

const Nav = () => {
  const classes = useStyles()
  const [clickedItem, setClickedItem] = useState('Day')

  const isSelected = innerText => {
    return innerText === clickedItem
  }

  return (
    <div className={classnames(classes.titleWrapper)}>
      <div className={classes.titleAndButtonsContainer}>
        <H4 className={classes.h4}>{'System performance'}</H4>
      </div>

      <Button
        onClick={e => setClickedItem(e.target.innerText)}
        size="small"
        disableRipple
        disableFocusRipple
        className={
          isSelected('All time') ? classes.highlightedLabel : classes.label
        }>
        All time
      </Button>
      <Button
        onClick={e => setClickedItem(e.target.innerText)}
        size="small"
        disableRipple
        disableFocusRipple
        className={
          isSelected('6 months') ? classes.highlightedLabel : classes.label
        }>
        6 months
      </Button>
      <Button
        onClick={e => setClickedItem(e.target.innerText)}
        size="small"
        disableRipple
        disableFocusRipple
        className={
          isSelected('Month') ? classes.highlightedLabel : classes.label
        }>
        Month
      </Button>
      <Button
        onClick={e => setClickedItem(e.target.innerText)}
        size="small"
        disableRipple
        disableFocusRipple
        className={
          isSelected('Week') ? classes.highlightedLabel : classes.label
        }>
        Week
      </Button>
      <Button
        size="small"
        disableRipple
        disableFocusRipple
        className={isSelected('Day') ? classes.highlightedLabel : classes.label}
        onClick={e => setClickedItem(e.target.innerText)}>
        Day
      </Button>
    </div>
  )
}

export default Nav
