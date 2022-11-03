import { useQuery } from '@apollo/react-hooks'
import SumsubWebSdk from '@sumsub/websdk-react'
import gql from 'graphql-tag'
import React from 'react'
import { useLocation } from 'react-router-dom'

const QueryParams = () => new URLSearchParams(useLocation().search)

const CREATE_NEW_TOKEN = gql`
  query getApplicantAccessToken($customerId: ID, $triggerId: ID) {
    getApplicantAccessToken(customerId: $customerId, triggerId: $triggerId)
  }
`

const Sumsub = () => {
  const token = QueryParams().get('t')
  const customerId = QueryParams().get('customer')
  const triggerId = QueryParams().get('trigger')

  const { refetch: getNewToken } = useQuery(CREATE_NEW_TOKEN, {
    skip: true,
    variables: { customerId: customerId, triggerId: triggerId }
  })

  const config = {
    lang: 'en'
  }

  const options = {
    addViewportTag: true,
    adaptIframeHeight: true
  }

  const updateAccessToken = () =>
    getNewToken().then(res => {
      const { getApplicantAccessToken: _token } = res.data
      return _token
    })

  return (
    <SumsubWebSdk
      accessToken={token}
      expirationHandler={updateAccessToken}
      config={config}
      options={options}
      onMessage={console.log}
      onError={console.error}
    />
  )
}

export default Sumsub
