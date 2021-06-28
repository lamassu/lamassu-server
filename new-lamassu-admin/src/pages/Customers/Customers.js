import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'

import Chip from 'src/components/Chip'
import SearchBox from 'src/components/SearchBox'
import TitleSection from 'src/components/layout/TitleSection'
import { P } from 'src/components/typography'
import baseStyles from 'src/pages/Logs.styles'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { fromNamespace, namespaces } from 'src/utils/config'

import { chipStyles } from '../Transactions/Transactions.styles'

import CustomersList from './CustomersList'
import styles from './CustomersList.styles'

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
    $address: String
    $id: String
  ) {
    config
    customers(phone: $phone, name: $name, address: $address, id: $id) {
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

const useStyles = makeStyles(styles)
const useChipStyles = makeStyles(chipStyles)
const useBaseStyles = makeStyles(baseStyles)

const Customers = () => {
  const classes = useStyles()
  const chipClasses = useChipStyles()
  const baseStyles = useBaseStyles()
  const history = useHistory()

  const handleCustomerClicked = customer =>
    history.push(`/compliance/customer/${customer.id}`)

  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [variables, setVariables] = useState({})
  const [filters, setFilters] = useState([])

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

  const configData = R.path(['config'])(customersResponse) ?? []
  const locale = configData && fromNamespace(namespaces.LOCALE, configData)
  const customersData = R.sortWith([R.descend(R.prop('lastActive'))])(
    filteredCustomers ?? []
  )

  const onFilterChange = filters => {
    const filtersObject = R.compose(
      R.mergeAll,
      R.map(f => ({
        [f.type]: f.value
      }))
    )(filters)

    setFilters(filters)

    setVariables({
      phone: filtersObject.phone,
      name: filtersObject.name,
      address: filtersObject.address,
      id: filtersObject.id
    })

    console.log({
      phone: filtersObject.phone,
      name: filtersObject.name,
      address: filtersObject.address,
      id: filtersObject.id
    })

    refetch && refetch()
  }

  const onFilterDelete = filter =>
    setFilters(
      R.filter(f => !R.whereEq(R.pick(['type', 'value'], f), filter))(filters)
    )

  const filterOptions = R.path(['customerFilters'])(filtersResponse)

  return (
    <>
      <TitleSection
        title="Customers"
        appendix={
          <div>
            <SearchBox
              loading={loadingFilters}
              filters={filters}
              options={filterOptions}
              inputPlaceholder={'Search customers'}
              onChange={onFilterChange}
            />
          </div>
        }
        appendixClassName={baseStyles.buttonsWrapper}
        labels={[
          { label: 'Cash-in', icon: <TxInIcon /> },
          { label: 'Cash-out', icon: <TxOutIcon /> }
        ]}
      />
      {filters.length > 0 && (
        <>
          <P className={classes.text}>{'Filters:'}</P>
          <div>
            {filters.map((f, idx) => (
              <Chip
                key={idx}
                classes={chipClasses}
                label={`${f.type}: ${f.value}`}
                onDelete={() => onFilterDelete(f)}
                deleteIcon={<CloseIcon className={classes.button} />}
              />
            ))}
            <Chip
              classes={chipClasses}
              label={`Delete filters`}
              onDelete={() => setFilters([])}
              deleteIcon={<CloseIcon className={classes.button} />}
            />
          </div>
        </>
      )}
      <CustomersList
        data={customersData}
        locale={locale}
        onClick={handleCustomerClicked}
        loading={customerLoading}
      />
    </>
  )
}

export default Customers
