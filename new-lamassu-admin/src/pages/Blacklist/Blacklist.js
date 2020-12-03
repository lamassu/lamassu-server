import { useQuery, useMutation } from '@apollo/react-hooks'
import { Box } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Tooltip } from 'src/components/Tooltip'
import { Link } from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'
import { H4, Label2, P } from 'src/components/typography'
import { fromNamespace, toNamespace } from 'src/utils/config'

import styles from './Blacklist.styles'
import BlackListModal from './BlacklistModal'
import BlacklistTable from './BlacklistTable'

const useStyles = makeStyles(styles)

const groupByCode = R.groupBy(obj => obj.cryptoCode)

const DELETE_ROW = gql`
  mutation DeleteBlacklistRow($cryptoCode: String!, $address: String!) {
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
  const [deleteEntry] = useMutation(DELETE_ROW, {
    onError: () => console.error('Error while deleting row'),
    refetchQueries: () => ['getBlacklistData']
  })

  const [addEntry] = useMutation(ADD_ROW, {
    onError: () => console.error('Error while adding row'),
    onCompleted: () => setShowModal(false),
    refetchQueries: () => ['getBlacklistData']
  })

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  const classes = useStyles()

  const blacklistData = R.path(['blacklist'])(blacklistResponse) ?? []
  const availableCurrencies =
    R.path(['cryptoCurrencies'], blacklistResponse) ?? []

  const formattedData = groupByCode(blacklistData)

  const complianceConfig =
    configData?.config && fromNamespace('compliance')(configData.config)

  const rejectAddressReuse = complianceConfig?.rejectAddressReuse ?? false

  const addressReuseSave = rawConfig => {
    const config = toNamespace('compliance')(rawConfig)
    return saveConfig({ variables: { config } })
  }

  const onClickSidebarItem = e => {
    setClickedItem({ code: e.code, display: e.display })
  }

  const handleDeleteEntry = (cryptoCode, address) => {
    deleteEntry({ variables: { cryptoCode, address } })
  }

  const addToBlacklist = (cryptoCode, address) => {
    addEntry({ variables: { cryptoCode, address } })
  }

  return (
    <>
      <TitleSection title="Blacklisted addresses">
        <Link onClick={() => setShowModal(false)}>Blacklist new addresses</Link>
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
                ? `${clickedItem.display} blacklisted addresses`
                : ''}{' '}
            </H4>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="end"
              mr="-5px">
              <P>Reject reused addresses</P>
              <Switch
                checked={rejectAddressReuse}
                onChange={event => {
                  addressReuseSave({ rejectAddressReuse: event.target.checked })
                }}
                value={rejectAddressReuse}
              />
              <Label2>{rejectAddressReuse ? 'On' : 'Off'}</Label2>
              <Tooltip width={304}>
                <P>
                  The "Reject reused addresses" option means that all addresses
                  that are used once will be automatically rejected if there's
                  an attempt to use them again on a new transaction.
                </P>
              </Tooltip>
            </Box>
          </Box>
          <BlacklistTable
            data={formattedData}
            selectedCoin={clickedItem}
            handleDeleteEntry={handleDeleteEntry}
          />
        </div>
      </Grid>
      {showModal && (
        <BlackListModal
          onClose={() => setShowModal(false)}
          selectedCoin={clickedItem}
          addToBlacklist={addToBlacklist}
        />
      )}
    </>
  )
}

export default Blacklist
