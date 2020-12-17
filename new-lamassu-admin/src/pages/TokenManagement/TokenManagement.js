import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'

import { IconButton } from 'src/components/buttons'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'

const GET_USER_TOKENS = gql`
  query userTokens {
    userTokens {
      token
      name
      created
      user_agent
      ip_address
    }
  }
`

const REVOKE_USER_TOKEN = gql`
  mutation revokeToken($token: String!) {
    revokeToken(token: $token) {
      token
    }
  }
`

const Tokens = () => {
  const { data: tknResponse } = useQuery(GET_USER_TOKENS)

  const [revokeToken] = useMutation(REVOKE_USER_TOKEN, {
    refetchQueries: () => ['userTokens']
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
      header: 'Token',
      width: 505,
      textAlign: 'center',
      size: 'sm',
      view: t => t.token
    },
    {
      header: 'Date (UTC)',
      width: 145,
      textAlign: 'right',
      size: 'sm',
      view: t => moment.utc(t.created).format('YYYY-MM-DD')
    },
    {
      header: 'Time (UTC)',
      width: 145,
      textAlign: 'right',
      size: 'sm',
      view: t => moment.utc(t.created).format('HH:mm:ss')
    },
    {
      header: '',
      width: 80,
      textAlign: 'center',
      size: 'sm',
      view: t => (
        <IconButton
          onClick={() => {
            revokeToken({ variables: { token: t.token } })
          }}>
          <DeleteIcon />
        </IconButton>
      )
    }
  ]

  return (
    <>
      <TitleSection title="Token Management" />
      <DataTable
        elements={elements}
        data={R.path(['userTokens'])(tknResponse)}
      />
    </>
  )
}

export default Tokens
