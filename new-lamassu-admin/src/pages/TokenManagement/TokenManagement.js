import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'

import Title from 'src/components/Title'
// import DataTable from 'src/components/tables/DataTable'
import { Table as EditableTable } from 'src/components/editableTable'

import { mainStyles } from './TokenManagement.styles'

const useStyles = makeStyles(mainStyles)

const GET_USER_TOKENS = gql`
  {
    userTokens {
      token
      name
      created
    }
  }
`

const Tokens = () => {
  const classes = useStyles()

  const { data: tknResponse } = useQuery(GET_USER_TOKENS)

  const elements = [
    {
      name: 'name',
      header: 'Name',
      width: 312,
      textAlign: 'center',
      size: 'sm'
    },
    {
      name: 'token',
      header: 'Token',
      width: 520,
      textAlign: 'center',
      size: 'sm'
    },
    {
      name: 'created',
      header: 'Date (UTC)',
      width: 140,
      textAlign: 'right',
      size: 'sm',
      view: t => moment.utc(t).format('YYYY-MM-DD')
    },
    {
      name: 'created',
      header: 'Time (UTC)',
      width: 140,
      textAlign: 'right',
      size: 'sm',
      view: t => moment.utc(t).format('HH:mm:ss')
    }
  ]

  return (
    <>
      {console.log(tknResponse)}
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Token Management</Title>
        </div>
      </div>
      <EditableTable
        name="tokenList"
        elements={elements}
        data={R.path(['userTokens'])(tknResponse)}
        enableDelete
      />
    </>
  )

  /* return (
    <>
      {console.log(tknResponse)}
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
  ) */
}

export default Tokens
