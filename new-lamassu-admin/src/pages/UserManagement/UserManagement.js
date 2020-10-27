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

const GET_USER_LATEST_TOKEN = gql`
  query userLatestToken {
    userLatestToken {
      name
      user_agent
      last_accessed
    }
  }
`

const REVOKE_USER_TOKENS = gql`
  mutation revokeUserTokens($name: String!) {
    revokeUserTokens(name: $name) {
      token
    }
  }
`

const Users = () => {
  const { data: userResponse } = useQuery(GET_USER_LATEST_TOKEN)

  const [revokeUserTokens] = useMutation(REVOKE_USER_TOKENS, {
    refetchQueries: () => ['userLatestToken']
  })

  const elements = [
    {
      header: 'Name',
      width: 257,
      textAlign: 'center',
      size: 'sm',
      view: t => t.name
    },
    {
      header: 'Last Accessed From',
      width: 505,
      textAlign: 'center',
      size: 'sm',
      view: t => {
        const ua = parser(t.user_agent)
        return `${ua.browser.name} ${ua.browser.version} on ${ua.os.name} ${ua.os.version}`
      }
    },
    {
      header: 'Last Accessed On',
      width: 290,
      textAlign: 'center',
      size: 'sm',
      view: t => `
        ${moment.utc(t.last_accessed).format('YYYY-MM-DD')} ${moment
        .utc(t.last_accessed)
        .format('HH:mm:ss')}
      `
    },
    {
      header: '',
      width: 80,
      textAlign: 'center',
      size: 'sm',
      view: t => (
        <IconButton
          onClick={() => {
            revokeUserTokens({ variables: { name: t.name } })
          }}>
          <DeleteIcon />
        </IconButton>
      )
    }
  ]

  return (
    <>
      <TitleSection title="User Management" />
      <DataTable
        elements={elements}
        data={R.path(['userLatestToken'])(userResponse)}
      />
    </>
  )
}

export default Users
