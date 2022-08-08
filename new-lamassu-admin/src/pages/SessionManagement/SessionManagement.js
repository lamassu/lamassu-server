import { gql, useApolloClient, useMutation, useQuery } from '@apollo/client'
import * as R from 'ramda'
import React from 'react'
import parser from 'ua-parser-js'

import { IconButton } from 'src/components/buttons'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { formatDate } from 'src/utils/timezones'

const GET_SESSIONS = gql`
  query sessions {
    sessions {
      sid
      sess
      expire
    }
  }
`

const DELETE_SESSION = gql`
  mutation deleteSession($sid: String!) {
    deleteSession(sid: $sid) {
      sid
    }
  }
`

const GET_CONFIG = gql`
  query getConfig {
    config
  }
`

const isLocalhost = ip => {
  return ip === 'localhost' || ip === '::1' || ip === '127.0.0.1'
}

const SessionManagement = () => {
  const { data: tknResponse, loading } = useQuery(GET_SESSIONS)

  const [deleteSession] = useMutation(DELETE_SESSION, {
    refetchQueries: () => ['sessions']
  })

  const configData = useApolloClient().readQuery({ query: GET_CONFIG })
  const timezone = R.path(['config', 'locale_timezone'], configData)

  const elements = [
    {
      header: 'Login',
      width: 207,
      textAlign: 'left',
      size: 'sm',
      view: s => s.sess.user.username
    },
    {
      header: 'Last known use',
      width: 305,
      textAlign: 'left',
      size: 'sm',
      view: s => {
        if (R.isNil(s.sess.ua)) return 'No Record'
        const ua = parser(s.sess.ua)
        return `${ua.browser.name} ${ua.browser.version} on ${ua.os.name} ${ua.os.version}`
      }
    },
    {
      header: 'Last known location',
      width: 250,
      textAlign: 'left',
      size: 'sm',
      view: s => {
        return isLocalhost(s.sess.ipAddress) ? 'This device' : s.sess.ipAddress
      }
    },
    {
      header: 'Expiration date',
      width: 290,
      textAlign: 'right',
      size: 'sm',
      view: s =>
        `${formatDate(s.expire, timezone, 'yyyy-MM-dd')} ${formatDate(
          s.expire,
          timezone,
          'HH:mm:ss'
        )}`
    },
    {
      header: '',
      width: 80,
      textAlign: 'center',
      size: 'sm',
      view: s => (
        <IconButton
          onClick={() => {
            deleteSession({ variables: { sid: s.sid } })
          }}>
          <DeleteIcon />
        </IconButton>
      )
    }
  ]

  return (
    <>
      <TitleSection title="Session Management" />
      <DataTable
        loading={loading}
        elements={elements}
        data={R.path(['sessions'])(tknResponse)}
      />
    </>
  )
}

export default SessionManagement
