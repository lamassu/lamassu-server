import React, { memo, useState } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import { H4 } from './typography'
import { Link } from './buttons'

import { NavLink } from 'react-router-dom'
import styles from './Header.styles'

const useStyles = makeStyles(styles)

const renderSubheader = (item, classes) => {
  if (!item || !item.children) return false
  return (
    <div className={classes.subheader}>
      <div className={classes.content}>
        <H4>{item.label}</H4>
        <nav>
          <ul className={classes.subheaderUl}>
            {item.children.map((it, idx) => (
              <li key={idx} className={classes.subheaderLi}>
                <NavLink
                  to={it.route}
                  className={classes.subheaderLink}
                  activeClassName={classes.activeSubheaderLink}
                >
                  {it.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={classes.addMachine}>
          <Link color='primary'>Add Machine</Link>
        </div>
      </div>
    </div>
  )
}

const Header = memo(({ tree }) => {
  const [active, setActive] = useState()
  const classes = useStyles()

  return (
    <header>
      <div className={classes.header}>
        <div className={classes.content}>
          <H4 className={classes.white}>Lamassu Admin</H4>
          <nav className={classes.nav}>
            <ul className={classes.ul}>
              {tree.map((it, idx) => (
                <li key={idx} className={classes.li}>
                  <NavLink
                    to={it.route || it.children[0].route}
                    isActive={match => {
                      if (!match) return false
                      setActive(it)
                      return true
                    }}
                    className={classnames(classes.link, classes.whiteLink)}
                    activeClassName={classes.activeLink}
                  >
                    {it.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      {renderSubheader(active, classes)}
    </header>
  )
})

export default Header
