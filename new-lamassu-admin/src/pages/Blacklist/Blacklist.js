import { useQuery, useMutation } from '@apollo/react-hooks'
import { addressDetector } from '@lamassu/coins'
import { Box, Dialog, DialogContent, DialogActions } from '@material-ui/core'
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
import TitleSection from 'src/components/layout/TitleSection'
import { H2, Label2, P, Info3, Info2 } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { ReactComponent as ReverseSettingsIcon } from 'src/styling/icons/circle buttons/settings/white.svg'
import { ReactComponent as SettingsIcon } from 'src/styling/icons/circle buttons/settings/zodiac.svg'
import { fromNamespace, toNamespace } from 'src/utils/config'

import styles from './Blacklist.styles'
import BlackListAdvanced from './BlacklistAdvanced'
import BlackListModal from './BlacklistModal'
import BlacklistTable from './BlacklistTable'

const useStyles = makeStyles(styles)

const DELETE_ROW = gql`
  mutation DeleteBlacklistRow($address: String!) {
    deleteBlacklistRow(address: $address) {
      address
    }
  }
`

const GET_BLACKLIST = gql`
  query getBlacklistData {
    blacklist {
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
  mutation InsertBlacklistRow($address: String!) {
    insertBlacklistRow(address: $address) {
      address
    }
  }
`

const GET_BLACKLIST_MESSAGES = gql`
  query getBlacklistMessages {
    blacklistMessages {
      id
      label
      content
      allowToggle
    }
  }
`

const EDIT_BLACKLIST_MESSAGE = gql`
  mutation editBlacklistMessage($id: ID, $content: String) {
    editBlacklistMessage(id: $id, content: $content) {
      id
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
  const { data: messagesResponse, refetch } = useQuery(GET_BLACKLIST_MESSAGES)
  const [showModal, setShowModal] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [editMessageError, setEditMessageError] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [advancedSettings, setAdvancedSettings] = useState(false)

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

  const [editMessage] = useMutation(EDIT_BLACKLIST_MESSAGE, {
    onError: e => setEditMessageError(e),
    refetchQueries: () => ['getBlacklistData']
  })

  const classes = useStyles()

  const blacklistData = R.path(['blacklist'])(blacklistResponse) ?? []

  const complianceConfig =
    configData?.config && fromNamespace('compliance')(configData.config)

  const rejectAddressReuse = !!complianceConfig?.rejectAddressReuse

  const enablePaperWalletOnly = !!complianceConfig?.enablePaperWalletOnly

  const addressReuseSave = rawConfig => {
    const config = toNamespace('compliance')(rawConfig)
    return saveConfig({ variables: { config } })
  }

  const handleDeleteEntry = address => {
    deleteEntry({ variables: { address } })
  }

  const handleConfirmDialog = confirm => {
    addressReuseSave({
      enablePaperWalletOnly: confirm
    })
    setConfirmDialog(false)
  }

  const validateAddress = address => {
    try {
      return !R.isEmpty(
        addressDetector.getSupportedCoinsForAddress(address).matches
      )
    } catch {
      return false
    }
  }

  const addToBlacklist = async address => {
    setErrorMsg(null)
    if (!validateAddress(address)) {
      setErrorMsg('Invalid address')
      return
    }
    const res = await addEntry({ variables: { address } })
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

  const editBlacklistMessage = r => {
    editMessage({
      variables: {
        id: r.id,
        content: r.content
      }
    })
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
      <TitleSection
        title="Blacklisted addresses"
        buttons={[
          {
            text: 'Advanced settings',
            icon: SettingsIcon,
            inverseIcon: ReverseSettingsIcon,
            toggle: setAdvancedSettings
          }
        ]}>
        {!advancedSettings && (
          <Box display="flex" alignItems="center" justifyContent="flex-end">
            <Box
              display="flex"
              alignItems="center"
              justifyContent="end"
              mr="15px">
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
              mr="15px">
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
            <Link color="primary" onClick={() => setShowModal(true)}>
              Blacklist new addresses
            </Link>
          </Box>
        )}
      </TitleSection>
      {!advancedSettings && (
        <div className={classes.content}>
          <BlacklistTable
            data={blacklistData}
            handleDeleteEntry={handleDeleteEntry}
            errorMessage={errorMsg}
            setErrorMessage={setErrorMsg}
            deleteDialog={deleteDialog}
            setDeleteDialog={setDeleteDialog}
          />
        </div>
      )}
      {advancedSettings && (
        <BlackListAdvanced
          data={messagesResponse}
          editBlacklistMessage={editBlacklistMessage}
          mutationError={editMessageError}
          onClose={() => refetch()}
        />
      )}
      {showModal && (
        <BlackListModal
          onClose={() => {
            setErrorMsg(null)
            setShowModal(false)
          }}
          errorMsg={errorMsg}
          addToBlacklist={addToBlacklist}
        />
      )}
    </>
  )
}

export default Blacklist
