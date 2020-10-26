import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'

import Title from 'src/components/Title'
import { IconButton } from 'src/components/buttons'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import * as browserOS from 'src/utils/browser-os'

import { mainStyles } from './TokenManagement.styles'

const useStyles = makeStyles(mainStyles)

const GET_USER_TOKENS = gql`
  query userTokens($browser: String!, $os: String!) {
    userTokens(browser: $browser, os: $os) {
      token
      name
      created
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
  const classes = useStyles()

  const userAgent = browserOS.getInformation(navigator.userAgent)

  const { data: tknResponse } = useQuery(GET_USER_TOKENS, {
    variables: {
      browser: `${userAgent.browser}`,
      os: `${userAgent.OS}`
    }
  })

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
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Token Management</Title>
        </div>
      </div>
      <DataTable
        elements={elements}
        data={R.path(['userTokens'])(tknResponse)}
      />
    </>
  )
}

export default Tokens
