import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { DeleteDialog } from 'src/components/DeleteDialog'
import { Link, Button, IconButton } from 'src/components/buttons'
import DataTable from 'src/components/tables/DataTable'
import { Label3, TL1 } from 'src/components/typography'
import { ReactComponent as PhoneIdIcon } from 'src/styling/icons/ID/phone/zodiac.svg'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { formatFullName } from 'src/utils/customer'

import styles from './IndividualDiscount.styles'
import IndividualDiscountModal from './IndividualDiscountModal'

const useStyles = makeStyles(styles)

const GET_INDIVIDUAL_DISCOUNTS = gql`
  query individualDiscounts {
    individualDiscountsWithCustomerData {
      id
      discount
      phone
      idCardData
    }
  }
`

const DELETE_DISCOUNT = gql`
  mutation deleteIndividualDiscount($discountId: ID!) {
    deleteIndividualDiscount(discountId: $discountId) {
      id
    }
  }
`

const CREATE_DISCOUNT = gql`
  mutation createIndividualDiscount($customerId: ID!, $discount: Int!) {
    createIndividualDiscount(customerId: $customerId, discount: $discount) {
      id
    }
  }
`

const GET_CUSTOMERS = gql`
  {
    customers {
      id
      phone
      idCardData
    }
  }
`

const IndividualDiscounts = () => {
  const classes = useStyles()

  const [deleteDialog, setDeleteDialog] = useState(false)
  const [toBeDeleted, setToBeDeleted] = useState()

  const [errorMsg, setErrorMsg] = useState('')
  const [showModal, setShowModal] = useState(false)
  const toggleModal = () => setShowModal(!showModal)

  const { data: discountResponse, loading: discountLoading } = useQuery(
    GET_INDIVIDUAL_DISCOUNTS
  )
  const { data: customerData, loading: customerLoading } = useQuery(
    GET_CUSTOMERS
  )

  const discounts =
    R.path(['individualDiscountsWithCustomerData'])(discountResponse) || []

  const [createDiscount, { error: creationError }] = useMutation(
    CREATE_DISCOUNT,
    {
      refetchQueries: () => ['individualDiscounts']
    }
  )

  const [deleteDiscount] = useMutation(DELETE_DISCOUNT, {
    onError: ({ message }) => {
      const errorMessage = message ?? 'Error while deleting row'
      setErrorMsg(errorMessage)
    },
    onCompleted: () => setDeleteDialog(false),
    refetchQueries: () => ['individualDiscounts']
  })

  const elements = [
    {
      header: 'Identification',
      width: 312,
      textAlign: 'left',
      size: 'sm',
      view: discount => (
        <div className={classes.identification}>
          <PhoneIdIcon />
          <span>{discount.phone}</span>
        </div>
      )
    },
    {
      header: 'Name',
      width: 300,
      textAlign: 'left',
      size: 'sm',
      view: discount =>
        R.isNil(discount.idCardData) ? (
          <>{'-'}</>
        ) : (
          <>{formatFullName(discount.idCardData)}</>
        )
    },
    {
      header: 'Discount rate',
      width: 220,
      textAlign: 'left',
      size: 'sm',
      view: discount => (
        <>
          <TL1 inline>{discount.discount}</TL1> %
        </>
      )
    },
    {
      header: 'Revoke',
      width: 100,
      textAlign: 'center',
      size: 'sm',
      view: discount => (
        <IconButton
          onClick={() => {
            setDeleteDialog(true)
            setToBeDeleted({ variables: { discountId: discount.id } })
          }}>
          <DeleteIcon />
        </IconButton>
      )
    }
  ]

  const loading = discountLoading || customerLoading

  return (
    <>
      {!loading && !R.isEmpty(discounts) && (
        <>
          <Box
            marginBottom={4}
            marginTop={-7}
            className={classes.tableWidth}
            display="flex"
            justifyContent="flex-end">
            <Link color="primary" onClick={toggleModal}>
              Add new code
            </Link>
          </Box>
          <DataTable elements={elements} data={discounts} />
          <DeleteDialog
            open={deleteDialog}
            onDismissed={() => {
              setDeleteDialog(false)
              setErrorMsg(null)
            }}
            onConfirmed={() => {
              setErrorMsg(null)
              deleteDiscount(toBeDeleted)
            }}
            errorMessage={errorMsg}
          />
        </>
      )}
      {!loading && R.isEmpty(discounts) && (
        <Box display="flex" alignItems="left" flexDirection="column">
          <Label3>
            It seems there are no active individual customer discounts on your
            network.
          </Label3>
          <Button onClick={toggleModal}>Add individual discount</Button>
        </Box>
      )}
      <IndividualDiscountModal
        showModal={showModal}
        setShowModal={setShowModal}
        onClose={() => {
          setShowModal(false)
        }}
        creationError={creationError}
        addDiscount={createDiscount}
        customers={R.path(['customers'])(customerData)}
      />
    </>
  )
}

export default IndividualDiscounts
