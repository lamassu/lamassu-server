import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

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

const CLEAR_NOTIFICATION = gql`
  mutation clearNotification($id: ID!) {
    clearNotification(id: $id) {
      id
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

const NotificationCenter = ({ close, notifyUnread }) => {
  const classes = useStyles()
  const { data, loading } = useQuery(GET_NOTIFICATIONS)
  const [showingUnread, setShowingUnread] = useState(false)
  const machines = R.compose(
    R.map(R.prop('name')),
    R.indexBy(R.prop('deviceId'))
  )(data?.machines ?? [])

  const notifications = R.path(['notifications'])(data) ?? []
  const hasUnread = data?.hasUnreadNotifications ?? false
  if (!hasUnread) {
    notifyUnread && notifyUnread()
  }
  const [clearNotification] = useMutation(CLEAR_NOTIFICATION, {
    onError: () => console.error('Error while clearing notification'),
    refetchQueries: () => ['getNotifications']
  })
  const [clearAllNotifications] = useMutation(CLEAR_ALL_NOTIFICATIONS, {
    onError: () => console.error('Error while clearing all notifications'),
    refetchQueries: () => ['getNotifications']
  })

  const handleClearNotification = id => {
    clearNotification({ variables: { id } })
  }
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
          onClear={handleClearNotification}
        />
      )
    })
  }

  return (
    <>
      <div className={classes.container}>
        <div className={classes.header}>
          <H5 className={classes.headerText}>Notifications</H5>
          <button onClick={close} className={classes.notificationIcon}>
            <NotificationIconZodiac />
            {hasUnread && <div className={classes.hasUnread} />}
          </button>
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
          <ActionButton
            color="primary"
            Icon={ClearAllIcon}
            InverseIcon={ClearAllIconInverse}
            className={classes.clearAllButton}
            onClick={clearAllNotifications}>
            Mark all as read
          </ActionButton>
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
