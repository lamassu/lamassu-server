import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo, useState } from 'react'
import { NavLink } from 'react-router-dom'

import { ReactComponent as Logo } from 'src/styling/icons/menu/logo.svg'

import styles from './Header.styles'
import { Link } from './buttons'
import { H4 } from './typography'

const useStyles = makeStyles(styles)

const renderSubheader = (item, classes) => {
  if (!item || !item.children) return false
  return (
    <div className={classes.subheader}>
      <div className={classes.content}>
        <nav>
          <ul className={classes.subheaderUl}>
            {item.children.map((it, idx) => (
              <li key={idx} className={classes.subheaderLi}>
                <NavLink
                  to={it.route}
                  className={classes.subheaderLink}
                  activeClassName={classes.activeSubheaderLink}>
                  {it.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={classes.addMachine}>
          <Link color="primary">Add Machine</Link>
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
          <div className={classes.logo}>
            <Logo />
            <H4 className={classes.white}>Lamassu Admin</H4>
          </div>
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
                    activeClassName={classes.activeLink}>
                    <span className={classes.forceSize} forcesize={it.label}>
                      {it.label}
                    </span>
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
