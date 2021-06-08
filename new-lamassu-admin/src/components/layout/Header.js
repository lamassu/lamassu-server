import { useQuery } from '@apollo/react-hooks'
import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import Popper from '@material-ui/core/Popper'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { memo, useState, useEffect, useRef } from 'react'
import { NavLink, useHistory } from 'react-router-dom'

import NotificationCenter from 'src/components/NotificationCenter'
import ActionButton from 'src/components/buttons/ActionButton'
import { H4 } from 'src/components/typography'
import AddMachine from 'src/pages/AddMachine'
import { ReactComponent as AddIconReverse } from 'src/styling/icons/button/add/white.svg'
import { ReactComponent as AddIcon } from 'src/styling/icons/button/add/zodiac.svg'
import { ReactComponent as Logo } from 'src/styling/icons/menu/logo.svg'
import { ReactComponent as NotificationIcon } from 'src/styling/icons/menu/notification.svg'

import styles from './Header.styles'

const useStyles = makeStyles(styles)

const buildTarget = process.env.REACT_APP_BUILD_TARGET

const HAS_UNREAD = gql`
  query getUnread {
    hasUnreadNotifications
  }
`

const Subheader = ({ item, classes, user }) => {
  const [prev, setPrev] = useState(null)

  return (
    <div className={classes.subheader}>
      <div className={classes.content}>
        <nav>
          <ul className={classes.subheaderUl}>
            {item.children.map((it, idx) => {
              if (!R.includes(user.role, it.allowedRoles)) return <></>
              if (!R.includes(buildTarget, it.targets)) return <></>
              return (
                <li key={idx} className={classes.subheaderLi}>
                  <NavLink
                    to={{ pathname: it.route, state: { prev } }}
                    className={classes.subheaderLink}
                    activeClassName={classes.activeSubheaderLink}
                    isActive={match => {
                      if (!match) return false
                      setPrev(it.route)
                      return true
                    }}>
                    {it.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}

const notNil = R.compose(R.not, R.isNil)

const Header = memo(({ tree, user }) => {
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [notifButtonCoords, setNotifButtonCoords] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState()
  const [hasUnread, setHasUnread] = useState(false)

  const { data, refetch, startPolling, stopPolling } = useQuery(HAS_UNREAD)
  const notifCenterButtonRef = useRef()
  const popperRef = useRef()
  const history = useHistory()
  const classes = useStyles()

  useEffect(() => {
    if (data?.hasUnreadNotifications) return setHasUnread(true)
    // if not true, make sure it's false and not undefined
    if (notNil(data?.hasUnreadNotifications)) return setHasUnread(false)
  }, [data])

  useEffect(() => {
    startPolling(60000)
    return stopPolling
  })

  const onPaired = machine => {
    setOpen(false)
    history.push('/maintenance/machine-status', { id: machine.deviceId })
  }

  // these inline styles prevent scroll bubbling: when the user reaches the bottom of the notifications list and keeps scrolling,
  // the body scrolls, stealing the focus from the notification center, preventing the admin from scrolling the notifications back up
  // on the first scroll, needing to move the mouse to recapture the focus on the notification center
  // it also disables the scrollbars caused by the notification center's background to the right of the page, but keeps the scrolling on the body enabled
  const onClickAway = () => {
    setAnchorEl(null)
    document.querySelector('#root').classList.remove('root-notifcenter-open')
    document.querySelector('body').classList.remove('body-notifcenter-open')
  }

  const handleClick = event => {
    const coords = notifCenterButtonRef.current.getBoundingClientRect()
    setNotifButtonCoords({ x: coords.x, y: coords.y })

    setAnchorEl(anchorEl ? null : event.currentTarget)
    document.querySelector('#root').classList.add('root-notifcenter-open')
    document.querySelector('body').classList.add('body-notifcenter-open')
  }

  const popperOpen = Boolean(anchorEl)
  const id = popperOpen ? 'notifications-popper' : undefined
  return (
    <header className={classes.headerContainer}>
      <div className={classes.header}>
        <div className={classes.content}>
          <div
            onClick={() => {
              setActive(false)
              history.push('/dashboard')
            }}
            className={classnames(classes.logo, classes.logoLink)}>
            <Logo />
            <H4 className={classes.white}>Lamassu Admin</H4>
          </div>
          <nav className={classes.nav}>
            <ul className={classes.ul}>
              {tree.map((it, idx) => {
                if (!R.includes(user.role, it.allowedRoles)) return <></>
                if (!R.includes(buildTarget, it.targets)) return <></>
                return (
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
                )
              })}
            </ul>
          </nav>
          <div className={classes.actionButtonsContainer}>
            <ActionButton
              color="secondary"
              Icon={AddIcon}
              InverseIcon={AddIconReverse}
              onClick={() => setOpen(true)}>
              Add machine
            </ActionButton>
            <ClickAwayListener onClickAway={onClickAway}>
              <div ref={notifCenterButtonRef}>
                <button
                  onClick={handleClick}
                  className={classes.notificationIcon}>
                  <NotificationIcon />
                  {hasUnread && <div className={classes.hasUnread} />}
                </button>
                <Popper
                  ref={popperRef}
                  id={id}
                  open={popperOpen}
                  anchorEl={anchorEl}
                  className={classes.popper}
                  disablePortal={false}
                  modifiers={{
                    preventOverflow: {
                      enabled: true,
                      boundariesElement: 'viewport'
                    }
                  }}>
                  <NotificationCenter
                    popperRef={popperRef}
                    buttonCoords={notifButtonCoords}
                    close={onClickAway}
                    hasUnreadProp={hasUnread}
                    refetchHasUnreadHeader={refetch}
                  />
                </Popper>
              </div>
            </ClickAwayListener>
          </div>
        </div>
      </div>
      {active && active.children && (
        <Subheader item={active} classes={classes} user={user} />
      )}
      {open && <AddMachine close={() => setOpen(false)} onPaired={onPaired} />}
    </header>
  )
})

export default Header
