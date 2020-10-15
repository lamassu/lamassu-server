import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo, useState } from 'react'
import { NavLink, useHistory } from 'react-router-dom'

import { Link } from 'src/components/buttons'
import { H4 } from 'src/components/typography'
import AddMachine from 'src/pages/AddMachine'
import { ReactComponent as Logo } from 'src/styling/icons/menu/logo.svg'

import styles from './Header.styles'

const useStyles = makeStyles(styles)

const Subheader = ({ item, classes }) => {
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
      </div>
    </div>
  )
}

const Header = memo(({ tree }) => {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState()

  const history = useHistory()
  const classes = useStyles()

  const onPaired = machine => {
    setOpen(false)
    history.push(`/maintenance/machine-status/${machine.deviceId}`)
  }

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
                <NavLink
                  key={idx}
                  to={it.route || it.children[0].route}
                  isActive={match => {
                    if (!match) return false
                    setActive(it)
                    return true
                  }}
                  className={classnames(classes.link, classes.whiteLink)}
                  activeClassName={classes.activeLink}>
                  <li className={classes.li}>
                    <span className={classes.forceSize} forcesize={it.label}>
                      {it.label}
                    </span>
                  </li>
                </NavLink>
              ))}
            </ul>
            <Link color="action" onClick={() => setOpen(true)}>
              Add Machine
            </Link>
          </nav>
        </div>
      </div>
      {active && active.children && (
        <Subheader item={active} classes={classes} />
      )}
      {open && <AddMachine close={() => setOpen(false)} onPaired={onPaired} />}
    </header>
  )
})

export default Header
