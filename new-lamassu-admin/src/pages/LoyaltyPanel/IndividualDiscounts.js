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
      idType
      value
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
  mutation createIndividualDiscount(
    $idType: DiscountIdentificationType!
    $value: String!
    $discount: Int!
  ) {
    createIndividualDiscount(
      idType: $idType
      value: $value
      discount: $discount
    ) {
      id
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
      view: t => (
        <div className={classes.identification}>
          {t.idType === 'phone' ? <PhoneIdIcon /> : <CardIdIcon />}
          {t.value}
        </div>
      )
    },
    {
      header: 'Name',
      width: 300,
      textAlign: 'left',
      size: 'sm',
      view: t => <>{'-'}</>
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

  return (
    <>
      {!loading && !R.isEmpty(discountResponse.individualDiscounts) && (
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
      {!loading && !R.isEmpty(discountResponse.individualDiscounts) && (
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
      {!loading && R.isEmpty(discountResponse.individualDiscounts) && (
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
      />
    </>
  )
}

export default IndividualDiscounts
