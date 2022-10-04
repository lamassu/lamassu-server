import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Formik, Form, Field } from 'formik'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { Link } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import { H3 } from 'src/components/typography'

import styles from './Blacklist.styles'
const useStyles = makeStyles(styles)

const BlackListModal = ({ onClose, addToBlacklist, errorMsg }) => {
  const classes = useStyles()
  const handleAddToBlacklist = address => {
    addToBlacklist(address)
  }

  const placeholderAddress = '1ADwinnimZKGgQ3dpyfoUZvJh4p1UWSSpD'

  return (
    <Modal
      closeOnBackdropClick={true}
      width={676}
      height={200}
      handleClose={onClose}
      open={true}>
      <Formik
        validateOnBlur={false}
        validateOnChange={false}
        initialValues={{
          address: ''
        }}
        validationSchema={Yup.object({
          address: Yup.string()
            .trim()
            .required('An address is required')
        })}
        onSubmit={({ address }) => {
          handleAddToBlacklist(address.trim())
        }}>
        <Form id="address-form">
          <H3 className={classes.modalTitle}>Blacklist new address</H3>
          <Field
            name="address"
            fullWidth
            autoComplete="off"
            label="Paste new address to blacklist here"
            placeholder={`ex: ${placeholderAddress}`}
            component={TextInput}
          />
        </Form>
      </Formik>
      <div className={classes.footer}>
        {!R.isNil(errorMsg) && <ErrorMessage>{errorMsg}</ErrorMessage>}
        <Box className={classes.submit}>
          <Link type="submit" form="address-form">
            Blacklist address
          </Link>
        </Box>
      </div>
    </Modal>
  )
}

export default BlackListModal
