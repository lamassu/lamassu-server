import { useQuery, useMutation } from '@apollo/react-hooks'
import { utils as coinUtils } from '@lamassu/coins'
import { Box, Dialog, DialogContent, DialogActions } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { HelpTooltip } from 'src/components/Tooltip'
import {
  Link,
  Button,
  IconButton,
  SupportLinkButton
} from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'
import { H4, H2, Label2, P, Info3, Info2 } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
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

const PaperWalletDialog = ({ onConfirmed, onDissmised, open, props }) => {
  const classes = useStyles()

  return (
    <Dialog
      open={open}
      aria-labelledby="form-dialog-title"
      PaperProps={{
        style: {
          borderRadius: 8,
          minWidth: 656,
          bottom: 125,
          right: 7
        }
      }}
      {...props}>
      <div className={classes.closeButton}>
        <IconButton size={16} aria-label="close" onClick={onDissmised}>
          <CloseIcon />
        </IconButton>
      </div>
      <H2 className={classes.dialogTitle}>
        {'Are you sure you want to enable this?'}
      </H2>
      <DialogContent className={classes.dialogContent}>
        <Info3>{`This mode means that only paper wallets will be printed for users, and they won't be permitted to scan an address from their own wallet.`}</Info3>
        <Info3>{`This mode is only useful for countries like Switzerland which mandates such a feature.\n`}</Info3>
        <Info2>{`Don't enable this if you want users to be able to scan an address of their choosing.`}</Info2>
      </DialogContent>
      <DialogActions className={classes.dialogActions}>
        <Button
          backgroundColor="grey"
          className={classes.cancelButton}
          onClick={() => onDissmised()}>
          Cancel
        </Button>
        <Button onClick={() => onConfirmed(true)}>Confirm</Button>
      </DialogActions>
    </Dialog>
  )
}

const Blacklist = () => {
  const { data: blacklistResponse } = useQuery(GET_BLACKLIST)
  const { data: configData } = useQuery(GET_INFO)
  const [showModal, setShowModal] = useState(false)
  const [clickedItem, setClickedItem] = useState({
    code: 'BTC',
    display: 'Bitcoin'
  })
  const [errorMsg, setErrorMsg] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)

  const [deleteEntry] = useMutation(DELETE_ROW, {
    onError: ({ message }) => {
      const errorMessage = message ?? 'Error while deleting row'
      setErrorMsg(errorMessage)
    },
    onCompleted: () => setDeleteDialog(false),
    refetchQueries: () => ['getBlacklistData']
  })

  const [addEntry] = useMutation(ADD_ROW, {
    onError: () => console.log('Error while adding row'),
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

  const rejectAddressReuse = !!complianceConfig?.rejectAddressReuse

  const enablePaperWalletOnly = !!complianceConfig?.enablePaperWalletOnly

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

  const handleConfirmDialog = confirm => {
    addressReuseSave({
      enablePaperWalletOnly: confirm
    })
    setConfirmDialog(false)
  }

  const validateAddress = (cryptoCode, address) => {
    try {
      return !R.isNil(coinUtils.parseUrl(cryptoCode, 'main', address))
    } catch {
      return false
    }
  }

  const addToBlacklist = async (cryptoCode, address) => {
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
      setErrorMsg('This address is already being blocked')
    } else {
      setErrorMsg('Server error')
    }
  }

  return (
    <>
      <PaperWalletDialog
        open={confirmDialog}
        onConfirmed={handleConfirmDialog}
        onDissmised={() => {
          setConfirmDialog(false)
        }}
      />
      <TitleSection title="Blacklisted addresses">
        <Box display="flex" justifyContent="flex-end">
          <Link color="primary" onClick={() => setShowModal(true)}>
            Blacklist new addresses
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
                ? `${clickedItem.display} blacklisted addresses`
                : ''}{' '}
            </H4>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="end"
              mr="-140px">
              <P>Enable paper wallet (only)</P>
              <Switch
                checked={enablePaperWalletOnly}
                onChange={e =>
                  enablePaperWalletOnly
                    ? addressReuseSave({
                        enablePaperWalletOnly: e.target.checked
                      })
                    : setConfirmDialog(true)
                }
                value={enablePaperWalletOnly}
              />
              <Label2>{enablePaperWalletOnly ? 'On' : 'Off'}</Label2>
              <HelpTooltip width={304}>
                <P>
                  The "Enable paper wallet (only)" option means that only paper
                  wallets will be printed for users, and they won't be permitted
                  to scan an address from their own wallet.
                </P>
              </HelpTooltip>
            </Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="flex-end"
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
              <HelpTooltip width={304}>
                <P>
                  This option requires a user to scan a fresh wallet address if
                  they attempt to scan one that had been previously used for a
                  transaction in your network.
                </P>
                <P>
                  For details please read the relevant knowledgebase article:
                </P>
                <SupportLinkButton
                  link="https://support.lamassu.is/hc/en-us/articles/360033622211-Reject-Address-Reuse"
                  label="Reject Address Reuse"
                  bottomSpace="1"
                />
              </HelpTooltip>
            </Box>
          </Box>
          <BlacklistTable
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
        <BlackListModal
          onClose={() => {
            setErrorMsg(null)
            setShowModal(false)
          }}
          errorMsg={errorMsg}
          selectedCoin={clickedItem}
          addToBlacklist={addToBlacklist}
        />
      )}
    </>
  )
}

export default Blacklist
