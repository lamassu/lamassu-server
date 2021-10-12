import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React from 'react'

import { ReactComponent as CustomerDataReversedIcon } from 'src/styling/icons/customer-nav/data/comet.svg'
import { ReactComponent as CustomerDataIcon } from 'src/styling/icons/customer-nav/data/white.svg'
import { ReactComponent as OverviewReversedIcon } from 'src/styling/icons/customer-nav/overview/comet.svg'
import { ReactComponent as OverviewIcon } from 'src/styling/icons/customer-nav/overview/white.svg'

import styles from './CustomerSidebar.styles.js'

const useStyles = makeStyles(styles)

const CustomerSidebar = ({ isSelected, onClick }) => {
  const classes = useStyles()
  const sideBarOptions = [
    {
      code: 'overview',
      display: 'Overview',
      Icon: OverviewIcon,
      InverseIcon: OverviewReversedIcon
    },
    {
      code: 'customerData',
      display: 'Customer Data',
      Icon: CustomerDataIcon,
      InverseIcon: CustomerDataReversedIcon
    }
  ]

  return (
    <div className={classes.sidebar}>
      {sideBarOptions?.map(({ Icon, InverseIcon, display, code }) => (
        <div
          className={classnames({
            [classes.activeLink]: isSelected(code),
            [classes.link]: true
          })}
          onClick={() => onClick(code)}>
          <div className={classes.icon}>
            {isSelected(code) ? <Icon /> : <InverseIcon />}
          </div>
          {display}
        </div>
      ))}
    </div>
  )
}

export default CustomerSidebar
