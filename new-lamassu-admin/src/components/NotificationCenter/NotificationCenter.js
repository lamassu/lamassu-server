import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState, useEffect } from 'react'

import ActionButton from 'src/components/buttons/ActionButton'
import { H5 } from 'src/components/typography'
import { ReactComponent as NotificationIconZodiac } from 'src/styling/icons/menu/notification-zodiac.svg'
import { ReactComponent as ClearAllIconInverse } from 'src/styling/icons/stage/spring/empty.svg'
import { ReactComponent as ClearAllIcon } from 'src/styling/icons/stage/zodiac/empty.svg'
import { ReactComponent as ShowUnreadIcon } from 'src/styling/icons/stage/zodiac/full.svg'

import styles from './NotificationCenter.styles'
import NotificationRow from './NotificationRow'

const useStyles = makeStyles(styles)

const GET_NOTIFICATIONS = gql`
  query getNotifications {
    notifications {
      id
      type
      detail
      message
      created
      read
      valid
    }
    hasUnreadNotifications
    machines {
      deviceId
      name
    }
  }
`

const TOGGLE_CLEAR_NOTIFICATION = gql`
  mutation toggleClearNotification($id: ID!, $read: Boolean!) {
    toggleClearNotification(id: $id, read: $read) {
      id
      read
    }
  }
`

const CLEAR_ALL_NOTIFICATIONS = gql`
  mutation clearAllNotifications {
    clearAllNotifications {
      id
    }
  }
`

const NotificationCenter = ({
  close,
  notifyUnread,
  hasUnreadProp,
  notifButtonCoords
}) => {
  const { data, loading } = useQuery(GET_NOTIFICATIONS, {
    pollInterval: 60000
  })
  const [showingUnread, setShowingUnread] = useState(false)
  const [xOffset, setXOffset] = useState(0)
  const classes = useStyles({ notifButtonCoords, xOffset })
  const machines = R.compose(
    R.map(R.prop('name')),
    R.indexBy(R.prop('deviceId'))
  )(data?.machines ?? [])

  const notifications = R.path(['notifications'])(data) ?? []
  const hasUnread = hasUnreadProp || (data?.hasUnreadNotifications ?? false)
  const popperDOM = document.querySelector('#notifications-popper')

  if (!hasUnread) {
    notifyUnread && notifyUnread()
  }
  const [toggleClearNotification] = useMutation(TOGGLE_CLEAR_NOTIFICATION, {
    onError: () => console.error('Error while clearing notification'),
    refetchQueries: () => ['getNotifications']
  })
  const [clearAllNotifications] = useMutation(CLEAR_ALL_NOTIFICATIONS, {
    onError: () => console.error('Error while clearing all notifications'),
    refetchQueries: () => ['getNotifications']
  })

  useEffect(() => {
    if (popperDOM) setXOffset(popperDOM.getBoundingClientRect().x)
  }, [popperDOM])
  const buildNotifications = () => {
    const notificationsToShow =
      !showingUnread || !hasUnread
        ? notifications
        : R.filter(R.propEq('read', false))(notifications)
    return notificationsToShow.map(n => {
      return (
        <NotificationRow
          key={n.id}
          id={n.id}
          type={n.type}
          detail={n.detail}
          message={n.message}
          deviceName={machines[n.detail.deviceId]}
          created={n.created}
          read={n.read}
          valid={n.valid}
          toggleClear={() =>
            toggleClearNotification({
              variables: { id: n.id, read: !n.read }
            })
          }
        />
      )
    })
  }

  return (
    <>
      <button onClick={close} className={classes.notificationIcon}>
        <NotificationIconZodiac />
        {hasUnread && <div className={classes.hasUnread} />}
      </button>
      <div className={classes.container}>
        <div className={classes.header}>
          <H5 className={classes.headerText}>Notifications</H5>
        </div>
        <div className={classes.actionButtons}>
          {hasUnread && (
            <ActionButton
              color="primary"
              Icon={ShowUnreadIcon}
              InverseIcon={ClearAllIconInverse}
              className={classes.clearAllButton}
              onClick={() => setShowingUnread(!showingUnread)}>
              {showingUnread ? 'Show all' : 'Show unread'}
            </ActionButton>
          )}
          {hasUnread && (
            <ActionButton
              color="primary"
              Icon={ClearAllIcon}
              InverseIcon={ClearAllIconInverse}
              className={classes.clearAllButton}
              onClick={clearAllNotifications}>
              Mark all as read
            </ActionButton>
          )}
        </div>
        <div className={classes.notificationsList}>
          {!loading && buildNotifications()}
        </div>
      </div>
      <div className={classes.background} />
    </>
  )
}

export default NotificationCenter
