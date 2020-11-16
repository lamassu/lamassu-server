import { makeStyles } from '@material-ui/core/styles'
import { Formik, Form, Field } from 'formik'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'
import { Link } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import { H3 } from 'src/components/typography'

import styles from './Blacklist.styles'
const useStyles = makeStyles(styles)

const BlackListModal = ({ onClose, selectedCoin, addToBlacklist }) => {
  const classes = useStyles()

  const handleAddToBlacklist = address => {
    addToBlacklist(selectedCoin.code, address)
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
      handleClose={onClose}
      open={true}>
      <Formik
        initialValues={{
          address: ''
        }}
        validationSchema={Yup.object({
          address: Yup.string()
            .trim()
            .required('An address is required')
        })}
        onSubmit={({ address }, { resetForm }) => {
          handleAddToBlacklist(address)
          resetForm()
        }}>
        <Form id="address-form">
          <H3>
            {selectedCoin.display
              ? `Blacklist ${R.toLower(selectedCoin.display)} address`
              : ''}
          </H3>
          <Field
            name="address"
            fullWidth
            autoComplete="off"
            label="Paste new address to blacklist here"
            placeholder={`ex: ${placeholderAddress[selectedCoin.code]}`}
            component={TextInput}
          />
        </Form>
      </Formik>
      <div className={classes.footer}>
        <Link type="submit" form="address-form">
          Blacklist address
        </Link>
      </div>
    </Modal>
  )
}

export default BlackListModal
