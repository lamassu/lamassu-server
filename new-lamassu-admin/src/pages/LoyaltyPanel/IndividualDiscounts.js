import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { DeleteDialog } from 'src/components/DeleteDialog'
import { Link, Button, IconButton } from 'src/components/buttons'
import DataTable from 'src/components/tables/DataTable'
import { Label3, TL1 } from 'src/components/typography'
import { ReactComponent as CardIdIcon } from 'src/styling/icons/ID/card/zodiac.svg'
import { ReactComponent as PhoneIdIcon } from 'src/styling/icons/ID/phone/zodiac.svg'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'

import styles from './IndividualDiscount.styles'
import IndividualDiscountModal from './IndividualDiscountModal'

const useStyles = makeStyles(styles)

const GET_INDIVIDUAL_DISCOUNTS = gql`
  query individualDiscounts {
    individualDiscounts {
      id
      customerId
      discount
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
      phone
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

  const { data: discountResponse, loading } = useQuery(GET_INDIVIDUAL_DISCOUNTS)
  const { data: customerData, loading: customerLoading } = useQuery(
    GET_CUSTOMERS
  )

  const [createDiscount, { error: creationError }] = useMutation(
    CREATE_DISCOUNT,
    {
      refetchQueries: () => ['individualDiscounts']
    }
  )

  const getCustomer = id => {
    const customers = R.path(['customers'])(customerData)
    return R.find(R.propEq('id', id))(customers)
  }

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
      view: t => {
        const customer = getCustomer(t.customerId)
        return (
          <div className={classes.identification}>
            <PhoneIdIcon />
            <span>{customer.phone}</span>
            {customer.idCardData?.documentNumber && (
              <>
                <CardIdIcon />
                <span>{customer.idCardData.documentNumber}</span>
              </>
            )}
          </div>
        )
      }
    },
    {
      header: 'Name',
      width: 300,
      textAlign: 'left',
      size: 'sm',
      view: t => {
        const customer = getCustomer(t.customerId)
        if (R.isNil(customer.idCardData)) {
          return <>{'-'}</>
        }

        return (
          <>{`${customer.idCardData.firstName ?? ``}${
            customer.idCardData.firstName && customer.idCardData.lastName
              ? ` `
              : ``
          }${customer.idCardData.lastName ?? ``}`}</>
        )
      }
    },
    {
      header: 'Discount rate',
      width: 220,
      textAlign: 'left',
      size: 'sm',
      view: t => (
        <>
          <TL1 inline>{t.discount}</TL1> %
        </>
      )
    },
    {
      header: 'Revoke',
      width: 100,
      textAlign: 'center',
      size: 'sm',
      view: t => (
        <IconButton
          onClick={() => {
            setDeleteDialog(true)
            setToBeDeleted({ variables: { discountId: t.id } })
          }}>
          <DeleteIcon />
        </IconButton>
      )
    }
  ]

  const isLoading = loading || customerLoading

  return (
    <>
      {!isLoading && !R.isEmpty(discountResponse.individualDiscounts) && (
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
      )}
      {!isLoading && !R.isEmpty(discountResponse.individualDiscounts) && (
        <>
          <DataTable
            elements={elements}
            data={R.path(['individualDiscounts'])(discountResponse)}
          />
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
      {!isLoading && R.isEmpty(discountResponse.individualDiscounts) && (
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
