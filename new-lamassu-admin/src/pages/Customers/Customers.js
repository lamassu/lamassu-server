import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'
import { useHistory } from 'react-router-dom'

import { fromNamespace, namespaces } from 'src/utils/config'

import CustomersList from './CustomersList'

const GET_CUSTOMERS = gql`
  {
    config
    customers {
      id
      idCardData
      phone
      totalTxs
      totalSpent
      lastActive
      lastTxFiat
      lastTxFiatCode
      lastTxClass
      authorizedOverride
      daysSuspended
      isSuspended
    }
  }
`

const Customers = () => {
  const history = useHistory()
  const { data: customersResponse, loading } = useQuery(GET_CUSTOMERS)

  const handleCustomerClicked = customer =>
    history.push(`/compliance/customer/${customer.id}`)

  const configData = R.path(['config'])(customersResponse) ?? []
  const locale = configData && fromNamespace(namespaces.LOCALE, configData)
  const customersData = R.sortWith([R.descend(R.prop('lastActive'))])(
    R.path(['customers'])(customersResponse) ?? []
  )

  return (
    <CustomersList
      data={customersData}
      locale={locale}
      onClick={handleCustomerClicked}
      loading={loading}
    />
  )
}

export default Customers
