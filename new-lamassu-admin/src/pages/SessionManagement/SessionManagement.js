import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'
import parser from 'ua-parser-js'

import { IconButton } from 'src/components/buttons'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'

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

const isLocalhost = ip => {
  return ip === 'localhost' || ip === '::1' || ip === '127.0.0.1'
}

const SessionManagement = () => {
  const { data: tknResponse } = useQuery(GET_SESSIONS)

  const [deleteSession] = useMutation(DELETE_SESSION, {
    refetchQueries: () => ['sessions']
  })

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
      textAlign: 'center',
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
      textAlign: 'center',
      size: 'sm',
      view: s => {
        return isLocalhost(s.sess.ipAddress) ? 'This device' : s.sess.ipAddress
      }
    },
    {
      header: 'Expiration date (UTC)',
      width: 290,
      textAlign: 'right',
      size: 'sm',
      view: s =>
        `${moment.utc(s.expire).format('YYYY-MM-DD')} ${moment
          .utc(s.expire)
          .format('HH:mm:ss')}`
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
      <DataTable elements={elements} data={R.path(['sessions'])(tknResponse)} />
    </>
  )
}

export default SessionManagement
