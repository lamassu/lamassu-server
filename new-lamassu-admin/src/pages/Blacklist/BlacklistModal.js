import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { Link } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs'
import { H3 } from 'src/components/typography'

import styles from './Blacklist.styles'
const useStyles = makeStyles(styles)

const BlackListModal = ({ onClose, selectedCoin, addToBlacklist }) => {
  const classes = useStyles()

  const [addressField, setAddressField] = useState('')
  const [invalidAddress, setInvalidAddress] = useState(false)

  const handleChange = event => {
    if (event.target.value === '') {
      setInvalidAddress(false)
    }
    setAddressField(event.target.value)
  }

  const handleAddToBlacklist = () => {
    if (addressField.trim() === '') {
      setInvalidAddress(true)
    } else {
      addToBlacklist(selectedCoin.code, addressField.trim())
    }
  }

  const handleClose = () => {
    setAddressField('')
    setInvalidAddress(false)
    onClose()
  }

  const placeholderAddress = {
    BTC: '1ADwinnimZKGgQ3dpyfoUZvJh4p1UWSSpD',
    ETH: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    LTC: 'LPKvbjwV1Kaksktzkr7TMK3FQtQEEe6Wqa',
    DASH: 'XqQ7gU8eM76rEfey726cJpT2RGKyJyBrcn',
    ZEC: 't1KGyyv24eL354C9gjveBGEe8Xz9UoPKvHR',
    BCH: 'qrd6za97wm03lfyg82w0c9vqgc727rhemg5yd9k3dm'
  }

  return (
    <Modal
      closeOnBackdropClick={true}
      width={676}
      height={200}
      handleClose={handleClose}
      open={true}>
      <H3>
        {selectedCoin.display
          ? `Blacklist ${R.toLower(selectedCoin.display)} address`
          : ''}
      </H3>
      <TextInput
        error={invalidAddress}
        label="Paste new address to blacklist here"
        name="address-to-block-input"
        autoFocus
        id="address-to-block-input"
        type="text"
        size="sm"
        fullWidth
        InputLabelProps={{ shrink: true }}
        placeholder={`ex: ${placeholderAddress[selectedCoin.code]}`} // "ex: 0x309abbd2f85ead2fcbb5323e963550c88c8a569aca4e088e9020a03fd04bf4bd"
        onChange={handleChange}
        value={addressField}
      />
      <div className={classes.footer}>
        <Link onClick={handleAddToBlacklist}>Blacklist address</Link>
      </div>
    </Modal>
  )
}

export default BlackListModal
