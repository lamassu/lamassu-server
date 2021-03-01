import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Breadcrumbs, Box } from '@material-ui/core'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { memo, useState } from 'react'
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
import { fromNamespace, namespaces } from 'src/utils/config'

import styles from './CustomerProfile.styles'
import {
  CustomerDetails,
  TransactionsList,
  ComplianceDetails
} from './components'
import { getFormattedPhone, getName } from './helper'

const useStyles = makeStyles(styles)
const ANONYMOUS_USER_NAME = 'anonymous'

const GET_CUSTOMER = gql`
  query customer($customerId: ID!) {
    config
    customer(customerId: $customerId) {
      id
      authorizedOverride
      frontCameraPath
      frontCameraOverride
      phone
      name
      smsOverride
      idCardData
      idCardDataOverride
      idCardDataExpiration
      idCardPhotoPath
      idCardPhotoOverride
      usSsn
      usSsnOverride
      sanctions
      sanctionsAt
      sanctionsOverride
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
      authorizedOverride
      frontCameraPath
      frontCameraOverride
      phone
      smsOverride
      idCardData
      idCardDataOverride
      idCardDataExpiration
      idCardPhotoPath
      idCardPhotoOverride
      usSsn
      usSsnOverride
      sanctions
      sanctionsAt
      sanctionsOverride
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
  const [showCompliance, setShowCompliance] = useState(false)
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

  const configData = R.path(['config'])(customerResponse) ?? []
  const locale = configData && fromNamespace(namespaces.LOCALE, configData)
  const customerData = R.path(['customer'])(customerResponse) ?? []
  const rawTransactions = R.path(['transactions'])(customerData) ?? []
  const sortedTransactions = R.sort(R.descend(R.prop('cryptoAtoms')))(
    rawTransactions
  )
  const name = getName(customerData)
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
          {name.length
            ? name
            : getFormattedPhone(
                R.path(['phone'])(customerData),
                locale.country
              )}
        </Label2>
      </Breadcrumbs>
      <div>
        <Box
          className={classes.customerDetails}
          display="flex"
          justifyContent="space-between">
          <CustomerDetails
            customer={customerData}
            locale={locale}
            setShowCompliance={() => setShowCompliance(!showCompliance)}
          />
          {!loading && customerData.name !== ANONYMOUS_USER_NAME && (
            <div>
              <Label1 className={classes.actionLabel}>Actions</Label1>
              <ActionButton
                color="primary"
                Icon={blocked ? AuthorizeIcon : BlockIcon}
                InverseIcon={
                  blocked ? AuthorizeReversedIcon : BlockReversedIcon
                }
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
          )}
        </Box>
      </div>
      {!showCompliance && (
        <TransactionsList
          customer={customerData}
          data={sortedTransactions}
          loading={loading}
        />
      )}
      {showCompliance && (
        <ComplianceDetails
          customer={customerData}
          updateCustomer={updateCustomer}
        />
      )}
    </>
  )
})

export default CustomerProfile
