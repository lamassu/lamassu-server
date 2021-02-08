import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { DeleteDialog } from 'src/components/DeleteDialog'
import { Link, Button, IconButton } from 'src/components/buttons'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'
import { H2, TL1 } from 'src/components/typography'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'

import styles from './PromoCodes.styles'
import PromoCodesModal from './PromoCodesModal'

const useStyles = makeStyles(styles)

const DUPLICATE_ERROR_MSG = 'There is already a promotion with that code!'
const DEFAULT_ERROR_MSG = 'Failed to save'

const GET_PROMO_CODES = gql`
  query promoCodes {
    promoCodes {
      id
      code
      discount
    }
  }
`

const DELETE_CODE = gql`
  mutation deletePromoCode($codeId: ID!) {
    deletePromoCode(codeId: $codeId) {
      id
    }
  }
`

const CREATE_CODE = gql`
  mutation createPromoCode($code: String!, $discount: Int!) {
    createPromoCode(code: $code, discount: $discount) {
      id
      code
      discount
    }
  }
`

const PromoCodes = () => {
  const classes = useStyles()

  const [deleteDialog, setDeleteDialog] = useState(false)
  const [toBeDeleted, setToBeDeleted] = useState()

  const [showModal, setShowModal] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const toggleModal = () => setShowModal(!showModal)

  const { data: codeResponse, loading } = useQuery(GET_PROMO_CODES)

  const [deleteCode] = useMutation(DELETE_CODE, {
    onError: ({ message }) => {
      const errorMessage = message ?? 'Error while deleting row'
      setErrorMsg(errorMessage)
    },
    onCompleted: () => setDeleteDialog(false),
    refetchQueries: () => ['promoCodes']
  })

  const [createCode] = useMutation(CREATE_CODE, {
    refetchQueries: () => ['promoCodes']
  })

  const addCode = (code, discount) => {
    setErrorMsg(null)
    createCode({
      variables: { code: code, discount: discount }
    })
      .then(res => {
        if (!res.errors) return setShowModal(false)

        const duplicateCodeError = R.any(it =>
          R.includes('duplicate', it?.message)
        )(res.errors)

        const msg = duplicateCodeError ? DUPLICATE_ERROR_MSG : DEFAULT_ERROR_MSG
        setErrorMsg(msg)
      })
      .catch(err => {
        setErrorMsg(DEFAULT_ERROR_MSG)
        console.log(err)
      })
  }

  const elements = [
    {
      header: 'Code',
      width: 300,
      textAlign: 'left',
      size: 'sm',
      view: t => t.code
    },
    {
      header: 'Discount',
      width: 220,
      textAlign: 'left',
      size: 'sm',
      view: t => (
        <>
          <TL1 inline>{t.discount}</TL1> % in commissions
        </>
      )
    },
    {
      header: 'Delete',
      width: 100,
      textAlign: 'center',
      size: 'sm',
      view: t => (
        <IconButton
          onClick={() => {
            setDeleteDialog(true)
            setToBeDeleted({ variables: { codeId: t.id } })
          }}>
          <DeleteIcon />
        </IconButton>
      )
    }
  ]

  return (
    <>
      <TitleSection title="Promo Codes"></TitleSection>
      {!loading && !R.isEmpty(codeResponse.promoCodes) && (
        <Box
          marginBottom={4}
          marginTop={-5}
          className={classes.tableWidth}
          display="flex"
          justifyContent="flex-end">
          <Link color="primary" onClick={toggleModal}>
            Add new code
          </Link>
        </Box>
      )}
      {!loading && !R.isEmpty(codeResponse.promoCodes) && (
        <>
          <DataTable
            elements={elements}
            data={R.path(['promoCodes'])(codeResponse)}
          />
          <DeleteDialog
            open={deleteDialog}
            onDismissed={() => {
              setDeleteDialog(false)
              setErrorMsg(null)
            }}
            onConfirmed={() => {
              setErrorMsg(null)
              deleteCode(toBeDeleted)
            }}
            errorMessage={errorMsg}
          />
        </>
      )}
      {!loading && R.isEmpty(codeResponse.promoCodes) && (
        <Box display="flex" alignItems="left" flexDirection="column">
          <H2>Currently, there are no active promo codes on your network.</H2>
          <Button onClick={toggleModal}>Add Code</Button>
        </Box>
      )}
      <PromoCodesModal
        showModal={showModal}
        onClose={() => {
          setErrorMsg(null)
          setShowModal(false)
        }}
        errorMsg={errorMsg}
        addCode={addCode}
      />
    </>
  )
}
export default PromoCodes
