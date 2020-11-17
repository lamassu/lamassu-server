import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import * as R from 'ramda'
import React, { useState } from 'react'
import { H4 } from 'src/components/typography'

import styles from './SystemPerformance.styles'

const useStyles = makeStyles(styles)
const ranges = ['Month', 'Week', 'Day']

const Nav = ({ handleSetRange }) => {
  const classes = useStyles()
  const [clickedItem, setClickedItem] = useState('Day')

  const isSelected = R.equals(clickedItem)
  const handleClick = range => {
    setClickedItem(range)
    handleSetRange(range)
  }

  return (
    <div className={classnames(classes.titleWrapper)}>
      <div className={classes.titleAndButtonsContainer}>
        <H4 className={classes.h4}>{'System performance'}</H4>
      </div>
      <div className={classes.navContainer}>
        {ranges.map((it, idx) => {
          return (
            <div
              key={idx}
              onClick={e => handleClick(e.target.innerText)}
              className={
                isSelected(it)
                  ? classnames(classes.newHighlightedLabel, classes.navButton)
                  : classnames(classes.label, classes.navButton)
              }>
              {it}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Nav
