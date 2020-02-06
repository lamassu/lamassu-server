import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { memo } from 'react'
import { useQuery, useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import { useHistory, useParams } from 'react-router-dom'
import Breadcrumbs from '@material-ui/core/Breadcrumbs'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'

import {
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'
import { ActionButton } from 'src/components/buttons'
import { Label1 } from 'src/components/typography'
import { ReactComponent as BlockReversedIcon } from 'src/styling/icons/button/block/white.svg'
import { ReactComponent as BlockIcon } from 'src/styling/icons/button/block/zodiac.svg'
import { ReactComponent as AuthorizeReversedIcon } from 'src/styling/icons/button/authorize/white.svg'
import { ReactComponent as AuthorizeIcon } from 'src/styling/icons/button/authorize/zodiac.svg'

import {
  CustomerDetails,
  IdDataCard,
  PhoneCard,
  IdCardPhotoCard,
  TransactionsList
} from './components'
import { mainStyles } from './Customers.styles'

const useStyles = makeStyles(mainStyles)

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

  const { data: customerResponse, refetch: getCustomer } = useQuery(
    GET_CUSTOMER,
    {
      variables: { customerId },
      fetchPolicy: 'no-cache'
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

  const transactionsData = R.sortWith([R.descend('created')])(
    R.path(['transactions'])(customerData) ?? []
  )

  const blocked =
    R.path(['authorizedOverride'])(customerData) === OVERRIDE_REJECTED

  return (
    <>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb">
        <Label1
          className={classes.labelLink}
          onClick={() => history.push('/compliance/customers')}>
          Customers
        </Label1>
        <Label1 className={classes.bold}>
          {R.path(['name'])(customerData)}
        </Label1>
      </Breadcrumbs>
      <div>
        <div className={classes.header}>
          <CustomerDetails customer={customerData} />
          <div className={classes.rightAligned}>
            <Label1 className={classes.label1}>Actions</Label1>
            <ActionButton
              className={classes.actionButton}
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
        </div>
        <div className={classes.rowCenterAligned}>
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
        </div>
      </div>
      <TransactionsList data={transactionsData} />
    </>
  )
})

export default CustomerProfile
