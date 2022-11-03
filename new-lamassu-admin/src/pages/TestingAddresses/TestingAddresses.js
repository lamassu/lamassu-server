import { useQuery, useMutation } from '@apollo/react-hooks'
import { utils as coinUtils } from '@lamassu/coins'
import { Box } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Link } from 'src/components/buttons'
import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'
import { H4 } from 'src/components/typography'

import styles from './TestingAddresses.styles'
import Modal from './TestingAddressesModal'
import Table from './TestingAddressesTable'

const useStyles = makeStyles(styles)

const groupByCode = R.groupBy(obj => obj.cryptoCode)

const DELETE_ROW = gql`
  mutation DeleteTestingAddress($cryptoCode: String!, $address: String!) {
    deleteTestingAddress(cryptoCode: $cryptoCode, address: $address) {
      cryptoCode
      address
    }
  }
`

const GET_DATA = gql`
  query getData {
    testingAddresses {
      cryptoCode
      address
    }
    cryptoCurrencies {
      display
      code
    }
  }
`

const ADD_ROW = gql`
  mutation AddTestingAddress($cryptoCode: String!, $address: String!) {
    addTestingAddress(cryptoCode: $cryptoCode, address: $address) {
      cryptoCode
      address
    }
  }
`

const TestingAddresses = () => {
  const { data } = useQuery(GET_DATA)
  const [showModal, setShowModal] = useState(false)
  const [clickedItem, setClickedItem] = useState({
    code: 'BTC',
    display: 'Bitcoin'
  })
  const [errorMsg, setErrorMsg] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const [deleteEntry] = useMutation(DELETE_ROW, {
    onError: ({ message }) => {
      const errorMessage = message ?? 'Error while deleting row'
      setErrorMsg(errorMessage)
    },
    onCompleted: () => setDeleteDialog(false),
    refetchQueries: () => ['getData']
  })

  const [addEntry] = useMutation(ADD_ROW, {
    onError: () => console.log('Error while adding row'),
    refetchQueries: () => ['getData']
  })

  const classes = useStyles()

  const addressesData = R.path(['testingAddresses'])(data) ?? []
  const availableCurrencies = R.path(['cryptoCurrencies'], data) ?? []

  const formattedData = groupByCode(addressesData)

  const onClickSidebarItem = e => {
    setClickedItem({ code: e.code, display: e.display })
  }

  const handleDeleteEntry = (cryptoCode, address) => {
    deleteEntry({ variables: { cryptoCode, address } })
  }

  const validateAddress = (cryptoCode, address) => {
    try {
      return !R.isNil(coinUtils.parseUrl(cryptoCode, 'main', address))
    } catch {
      return false
    }
  }

  const addTestingAddress = async (cryptoCode, address) => {
    setErrorMsg(null)
    if (!validateAddress(cryptoCode, address)) {
      setErrorMsg('Invalid address')
      return
    }
    const res = await addEntry({ variables: { cryptoCode, address } })
    if (!res.errors) {
      return setShowModal(false)
    }
    const duplicateKeyError = res.errors.some(e => {
      return e.message.includes('duplicate')
    })
    if (duplicateKeyError) {
      setErrorMsg('This address is already listed')
    } else {
      setErrorMsg('Server error')
    }
  }

  return (
    <>
      <TitleSection title="Testing addresses">
        <Box display="flex" justifyContent="flex-end">
          <Link color="primary" onClick={() => setShowModal(true)}>
            Add new address
          </Link>
        </Box>
      </TitleSection>
      <Grid container className={classes.grid}>
        <Sidebar
          data={availableCurrencies}
          isSelected={R.propEq('code', clickedItem.code)}
          displayName={it => it.display}
          onClick={onClickSidebarItem}
        />
        <div className={classes.content}>
          <Box display="flex" justifyContent="space-between" mb={3}>
            <H4 noMargin className={classes.subtitle}>
              {clickedItem.display
                ? `${clickedItem.display} testing addresses`
                : ''}{' '}
            </H4>
          </Box>
          <Table
            data={formattedData}
            selectedCoin={clickedItem}
            handleDeleteEntry={handleDeleteEntry}
            errorMessage={errorMsg}
            setErrorMessage={setErrorMsg}
            deleteDialog={deleteDialog}
            setDeleteDialog={setDeleteDialog}
          />
        </div>
      </Grid>
      {showModal && (
        <Modal
          onClose={() => {
            setErrorMsg(null)
            setShowModal(false)
          }}
          errorMsg={errorMsg}
          selectedCoin={clickedItem}
          addTestingAddress={addTestingAddress}
        />
      )}
    </>
  )
}

export default TestingAddresses
