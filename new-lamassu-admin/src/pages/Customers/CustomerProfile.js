import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Breadcrumbs, Box } from '@material-ui/core'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { memo } from 'react'
import { useHistory, useParams } from 'react-router-dom'

import { ActionButton } from 'src/components/buttons'
import { Label1, Label2 } from 'src/components/typography'
import {
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'
import { ReactComponent as AuthorizeReversedIcon } from 'src/styling/icons/button/authorize/white.svg'
import { ReactComponent as AuthorizeIcon } from 'src/styling/icons/button/authorize/zodiac.svg'
import { ReactComponent as BlockReversedIcon } from 'src/styling/icons/button/block/white.svg'
import { ReactComponent as BlockIcon } from 'src/styling/icons/button/block/zodiac.svg'

import styles from './CustomerProfile.styles'
import {
  CustomerDetails,
  IdDataCard,
  PhoneCard,
  IdCardPhotoCard,
  TransactionsList
} from './components'

const useStyles = makeStyles(styles)

const GET_CUSTOMER = gql`
  query customer($customerId: ID!) {
    customer(customerId: $customerId) {
      id
      name
      authorizedOverride
      frontCameraPath
      phone
      smsOverride
      idCardData
      idCardDataOverride
      idCardDataExpiration
      idCardPhotoPath
      idCardPhotoOverride
      totalTxs
      totalSpent
      lastActive
      lastTxFiat
      lastTxFiatCode
      lastTxClass
      transactions {
        txClass
        id
        fiat
        fiatCode
        cryptoAtoms
        cryptoCode
        created
        errorMessage: error
        error: errorCode
      }
    }
  }
`

const SET_CUSTOMER = gql`
  mutation setCustomer($customerId: ID!, $customerInput: CustomerInput) {
    setCustomer(customerId: $customerId, customerInput: $customerInput) {
      id
      name
      authorizedOverride
      frontCameraPath
      phone
      smsOverride
      idCardData
      idCardDataOverride
      idCardDataExpiration
      idCardPhotoPath
      idCardPhotoOverride
      totalTxs
      totalSpent
      lastActive
      lastTxFiat
      lastTxFiatCode
      lastTxClass
    }
  }
`

const CustomerProfile = memo(() => {
  const classes = useStyles()
  const history = useHistory()
  const { id: customerId } = useParams()

  const { data: customerResponse, refetch: getCustomer, loading } = useQuery(
    GET_CUSTOMER,
    {
      variables: { customerId }
    }
  )

  const [setCustomer] = useMutation(SET_CUSTOMER, {
    onCompleted: () => getCustomer()
  })

  const updateCustomer = it =>
    setCustomer({
      variables: {
        customerId,
        customerInput: it
      }
    })

  const customerData = R.path(['customer'])(customerResponse) ?? []
  const rawTransactions = R.path(['transactions'])(customerData) ?? []
  const sortedTransactions = R.sort(R.descend(R.prop('cryptoAtoms')))(
    rawTransactions
  )

  const blocked =
    R.path(['authorizedOverride'])(customerData) === OVERRIDE_REJECTED

  return (
    <>
      <Breadcrumbs
        classes={{ root: classes.breadcrumbs }}
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb">
        <Label1
          noMargin
          className={classes.labelLink}
          onClick={() => history.push('/compliance/customers')}>
          Customers
        </Label1>
        <Label2 noMargin className={classes.labelLink}>
          {R.path(['name'])(customerData) ?? R.path(['phone'])(customerData)}
        </Label2>
      </Breadcrumbs>
      <div>
        <Box display="flex" justifyContent="space-between">
          <CustomerDetails customer={customerData} />
          <div>
            <Label1 className={classes.actionLabel}>Actions</Label1>
            <ActionButton
              color="primary"
              Icon={blocked ? AuthorizeIcon : BlockIcon}
              InverseIcon={blocked ? AuthorizeReversedIcon : BlockReversedIcon}
              onClick={() =>
                updateCustomer({
                  authorizedOverride: blocked
                    ? OVERRIDE_AUTHORIZED
                    : OVERRIDE_REJECTED
                })
              }>
              {`${blocked ? 'Authorize' : 'Block'} customer`}
            </ActionButton>
          </div>
        </Box>
        <Box display="flex">
          <IdDataCard
            customerData={customerData}
            updateCustomer={updateCustomer}
          />
          <PhoneCard
            customerData={customerData}
            updateCustomer={updateCustomer}
          />
          <IdCardPhotoCard
            customerData={customerData}
            updateCustomer={updateCustomer}
          />
        </Box>
      </div>
      <TransactionsList data={sortedTransactions} loading={loading} />
    </>
  )
})

export default CustomerProfile
