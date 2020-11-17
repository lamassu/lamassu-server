// import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { useState } from 'react'

import { H4 } from 'src/components/typography'

import styles from './SystemPerformance.styles'
const useStyles = makeStyles(styles)

const Nav = ({ handleSetRange }) => {
  const classes = useStyles()
  const [clickedItem, setClickedItem] = useState('Day')

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
      <div style={{ display: 'flex' }}>
        <div
          onClick={e => handleClick(e.target.innerText)}
          className={
            isSelected('Month')
              ? classnames(classes.newHighlightedLabel, classes.navButton)
              : classnames(classes.label, classes.navButton)
          }>
          Month
        </div>
        <div
          onClick={e => handleClick(e.target.innerText)}
          className={
            isSelected('Week')
              ? classnames(classes.newHighlightedLabel, classes.navButton)
              : classnames(classes.label, classes.navButton)
          }>
          Week
        </div>
        <div
          className={
            isSelected('Day')
              ? classnames(classes.newHighlightedLabel, classes.navButton)
              : classnames(classes.label, classes.navButton)
          }
          onClick={e => handleClick(e.target.innerText)}>
          Day
        </div>
      </div>
    </div>
  )
}

export default Nav
