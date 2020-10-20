import { useQuery, useMutation } from '@apollo/react-hooks'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Link } from 'src/components/buttons'
import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'

import styles from './Blacklist.styles'
import BlackListModal from './BlacklistModal'
import BlacklistTable from './BlacklistTable'

const useStyles = makeStyles(styles)

const groupByCode = R.groupBy(obj => obj.cryptoCode)

const DELETE_ROW = gql`
  mutation DeleteBlacklistRow($cryptoCode: String, $address: String) {
    deleteBlacklistRow(cryptoCode: $cryptoCode, address: $address) {
      cryptoCode
      address
    }
  }
`

const GET_BLACKLIST = gql`
  query getBlacklistData {
    blacklist {
      cryptoCode
      address
    }
    cryptoCurrencies {
      display
      code
    }
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const GET_INFO = gql`
  query getData {
    config
  }
`

const ADD_ROW = gql`
  mutation InsertBlacklistRow($cryptoCode: String!, $address: String!) {
    insertBlacklistRow(cryptoCode: $cryptoCode, address: $address) {
      cryptoCode
      address
    }
  }
`

const Blacklist = () => {
  const { data: blacklistResponse } = useQuery(GET_BLACKLIST)
  const { data: configData } = useQuery(GET_INFO)
  const [showModal, setShowModal] = useState(false)
  const [clickedItem, setClickedItem] = useState({
    code: 'BTC',
    display: 'Bitcoin'
  })
  const classes = useStyles()

  const blacklistData = R.path(['blacklist'])(blacklistResponse) ?? []
  const availableCurrencies =
    R.path(['cryptoCurrencies'], blacklistResponse) ?? []

  const formattedData = groupByCode(blacklistData)

  const onClickSidebarItem = e => {
    setClickedItem({ code: e.code, display: e.display })
  }

  const [deleteEntry] = useMutation(DELETE_ROW, {
    onError: () => console.error('Error while deleting row'),
    refetchQueries: () => ['getBlacklistData']
  })

  const handleDeleteEntry = (cryptoCode, address) => {
    deleteEntry({ variables: { cryptoCode, address } })
  }

  const [addEntry] = useMutation(ADD_ROW, {
    onError: () => console.error('Error while adding row'),
    refetchQueries: () => ['getBlacklistData']
  })

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  const isSelected = it => clickedItem.code === it.code

  const toggleModal = () => setShowModal(!showModal)

  const addToBlacklist = (cryptoCode, address) => {
    addEntry({ variables: { cryptoCode, address } })
  }

  return (
    <>
      <TitleSection title="Blacklisted addresses">
        <Link onClick={toggleModal}>Blacklist new addresses</Link>
      </TitleSection>
      <Grid container className={classes.grid}>
        <Sidebar
          data={availableCurrencies}
          isSelected={isSelected}
          displayName={it => it.display}
          onClick={onClickSidebarItem}
        />
        <div className={classes.content}>
          <BlacklistTable
            data={formattedData}
            selectedCoin={clickedItem}
            handleDeleteEntry={handleDeleteEntry}
            saveConfig={saveConfig}
            configData={configData}
          />
        </div>
      </Grid>
      <BlackListModal
        showModal={showModal}
        toggleModal={toggleModal}
        selectedCoin={clickedItem}
        addToBlacklist={addToBlacklist}
      />
    </>
  )
}

export default Blacklist
