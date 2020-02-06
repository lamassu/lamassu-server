import { useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import { useHistory } from 'react-router-dom'
import * as R from 'ramda'
import React from 'react'

import CustomersList from './CustomersList'

const GET_CUSTOMERS = gql`
  {
    customers {
      id
      name
      phone
      totalTxs
      totalSpent
      lastActive
      lastTxFiat
      lastTxFiatCode
      lastTxClass
    }
  }
`

const Customers = () => {
  const history = useHistory()
  const { data: customersResponse } = useQuery(GET_CUSTOMERS)

  const handleCustomerClicked = customer =>
    history.push(`/compliance/customer/${customer.id}`)

  const customersData = R.sortWith([R.descend('lastActive')])(
    R.path(['customers'])(customersResponse) ?? []
  )

  return <CustomersList data={customersData} onClick={handleCustomerClicked} />
}

export default Customers
