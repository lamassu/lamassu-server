import { useQuery, useMutation } from '@apollo/react-hooks'
import { Box, makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'

import SearchBox from 'src/components/SearchBox'
import SearchFilter from 'src/components/SearchFilter'
import { Link } from 'src/components/buttons'
import TitleSection from 'src/components/layout/TitleSection'
import baseStyles from 'src/pages/Logs.styles'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { fromNamespace, namespaces } from 'src/utils/config'

import CustomersList from './CustomersList'
import CreateCustomerModal from './components/CreateCustomerModal'
import { getAuthorizedStatus } from './helper'

const GET_CUSTOMER_FILTERS = gql`
  query filters {
    customerFilters {
      type
      value
    }
  }
`

const GET_CUSTOMERS = gql`
  query configAndCustomers(
    $phone: String
    $name: String
    $email: String
    $address: String
    $id: String
  ) {
    config
    customers(
      phone: $phone
      email: $email
      name: $name
      address: $address
      id: $id
    ) {
      id
      idCardData
      phone
      email
      totalTxs
      totalSpent
      lastActive
      lastTxFiat
      lastTxFiatCode
      lastTxClass
      authorizedOverride
      frontCameraPath
      frontCameraOverride
      idCardPhotoPath
      idCardPhotoOverride
      idCardData
      idCardDataOverride
      usSsn
      usSsnOverride
      sanctions
      sanctionsOverride
      daysSuspended
      isSuspended
      customInfoRequests {
        customerId
        infoRequestId
        override
        overrideAt
        overrideBy
        customerData
        customInfoRequest {
          id
          enabled
          customRequest
        }
      }
    }
    customInfoRequests {
      id
    }
  }
`

const CREATE_CUSTOMER = gql`
  mutation createCustomer($phoneNumber: String) {
    createCustomer(phoneNumber: $phoneNumber) {
      phone
    }
  }
`

const useBaseStyles = makeStyles(baseStyles)

const getFiltersObj = filters =>
  R.reduce((s, f) => ({ ...s, [f.type]: f.value }), {}, filters)

const Customers = () => {
  const baseStyles = useBaseStyles()
  const history = useHistory()

  const handleCustomerClicked = customer =>
    history.push(`/compliance/customer/${customer.id}`)

  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [variables, setVariables] = useState({})
  const [filters, setFilters] = useState([])
  const [showCreationModal, setShowCreationModal] = useState(false)

  const {
    data: customersResponse,
    loading: customerLoading,
    refetch
  } = useQuery(GET_CUSTOMERS, {
    variables,
    onCompleted: data => setFilteredCustomers(R.path(['customers'])(data))
  })

  const { data: filtersResponse, loading: loadingFilters } = useQuery(
    GET_CUSTOMER_FILTERS
  )

  const [createNewCustomer] = useMutation(CREATE_CUSTOMER, {
    onCompleted: () => setShowCreationModal(false),
    refetchQueries: () => [
      {
        query: GET_CUSTOMERS,
        variables
      }
    ]
  })

  const configData = R.path(['config'])(customersResponse) ?? []
  const customRequirementsData =
    R.path(['customInfoRequests'], customersResponse) ?? []
  const locale = configData && fromNamespace(namespaces.LOCALE, configData)
  const triggers = configData && fromNamespace(namespaces.TRIGGERS, configData)

  const setAuthorizedStatus = c =>
    R.assoc(
      'authorizedStatus',
      getAuthorizedStatus(c, triggers, customRequirementsData),
      c
    )

  const byAuthorized = c => (c.authorizedStatus.label === 'Pending' ? 0 : 1)
  const byLastActive = c => new Date(R.prop('lastActive', c) ?? '0')
  const customersData = R.pipe(
    R.map(setAuthorizedStatus),
    R.sortWith([R.ascend(byAuthorized), R.descend(byLastActive)])
  )(filteredCustomers ?? [])

  const onFilterChange = filters => {
    const filtersObject = getFiltersObj(filters)

    setFilters(filters)

    setVariables({
      phone: filtersObject.phone,
      name: filtersObject.name,
      email: filtersObject.email,
      address: filtersObject.address,
      id: filtersObject.id
    })

    refetch && refetch()
  }

  const onFilterDelete = filter => {
    const newFilters = R.filter(
      f => !R.whereEq(R.pick(['type', 'value'], f), filter)
    )(filters)

    setFilters(newFilters)

    const filtersObject = getFiltersObj(newFilters)

    setVariables({
      phone: filtersObject.phone,
      name: filtersObject.name,
      email: filtersObject.email,
      address: filtersObject.address,
      id: filtersObject.id
    })

    refetch && refetch()
  }

  const deleteAllFilters = () => {
    setFilters([])
    const filtersObject = getFiltersObj([])

    setVariables({
      phone: filtersObject.phone,
      name: filtersObject.name,
      email: filtersObject.email,
      address: filtersObject.address,
      id: filtersObject.id
    })

    refetch && refetch()
  }

  const filterOptions = R.path(['customerFilters'])(filtersResponse)

  return (
    <>
      <TitleSection
        title="Customers"
        appendix={
          <div className={baseStyles.buttonsWrapper}>
            <SearchBox
              loading={loadingFilters}
              filters={filters}
              options={filterOptions}
              inputPlaceholder={'Search customers'}
              onChange={onFilterChange}
            />
          </div>
        }
        appendixRight={
          <Box display="flex">
            <Link color="primary" onClick={() => setShowCreationModal(true)}>
              Add new user
            </Link>
          </Box>
        }
        labels={[
          { label: 'Cash-in', icon: <TxInIcon /> },
          { label: 'Cash-out', icon: <TxOutIcon /> }
        ]}
      />
      {filters.length > 0 && (
        <SearchFilter
          entries={customersData.length}
          filters={filters}
          onFilterDelete={onFilterDelete}
          deleteAllFilters={deleteAllFilters}
        />
      )}
      <CustomersList
        data={customersData}
        locale={locale}
        onClick={handleCustomerClicked}
        loading={customerLoading}
        triggers={triggers}
        customRequests={customRequirementsData}
      />
      <CreateCustomerModal
        showModal={showCreationModal}
        handleClose={() => setShowCreationModal(false)}
        locale={locale}
        onSubmit={createNewCustomer}
      />
    </>
  )
}

export default Customers
