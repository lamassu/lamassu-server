import { makeStyles } from '@material-ui/core/styles'
import { Form, Formik, Field } from 'formik'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { ActionButton, IconButton, Button } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as DisabledDeleteIcon } from 'src/styling/icons/action/delete/disabled.svg'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as DefaultIconReverse } from 'src/styling/icons/button/retry/white.svg'
import { ReactComponent as DefaultIcon } from 'src/styling/icons/button/retry/zodiac.svg'

import styles from './Blacklist.styles'

const useStyles = makeStyles(styles)

const DEFAULT_MESSAGE = `This address may be associated with a deceptive offer or a prohibited group. Please make sure you're using an address from your own wallet.`

const getErrorMsg = (formikErrors, formikTouched, mutationError) => {
  if (mutationError) return 'Internal server error'
  if (!formikErrors || !formikTouched) return null
  if (formikErrors.event && formikTouched.event) return formikErrors.event
  if (formikErrors.message && formikTouched.message) return formikErrors.message
  return null
}

const BlacklistAdvanced = ({
  data,
  editBlacklistMessage,
  onClose,
  mutationError
}) => {
  const classes = useStyles()
  const [selectedMessage, setSelectedMessage] = useState(null)

  const elements = [
    {
      name: 'label',
      header: 'Label',
      width: 250,
      textAlign: 'left',
      size: 'sm',
      view: it => R.path(['label'], it)
    },
    {
      name: 'content',
      header: 'Content',
      width: 690,
      textAlign: 'left',
      size: 'sm',
      view: it => R.path(['content'], it)
    },
    {
      name: 'edit',
      header: 'Edit',
      width: 130,
      textAlign: 'center',
      size: 'sm',
      view: it => (
        <IconButton
          className={classes.deleteButton}
          onClick={() => setSelectedMessage(it)}>
          <EditIcon />
        </IconButton>
      )
    },
    {
      name: 'deleteButton',
      header: 'Delete',
      width: 130,
      textAlign: 'center',
      size: 'sm',
      view: it => (
        <IconButton
          className={classes.deleteButton}
          disabled={
            !R.isNil(R.path(['allowToggle'], it)) &&
            !R.path(['allowToggle'], it)
          }>
          {R.path(['allowToggle'], it) ? (
            <DeleteIcon />
          ) : (
            <DisabledDeleteIcon />
          )}
        </IconButton>
      )
    }
  ]

  const handleModalClose = () => {
    setSelectedMessage(null)
  }

  const handleSubmit = values => {
    editBlacklistMessage(values)
    handleModalClose()
    !R.isNil(onClose) && onClose()
  }

  const initialValues = {
    label: !R.isNil(selectedMessage) ? selectedMessage.label : '',
    content: !R.isNil(selectedMessage) ? selectedMessage.content : ''
  }

  const validationSchema = Yup.object().shape({
    label: Yup.string().required('A label is required!'),
    content: Yup.string()
      .required('The message content is required!')
      .trim()
  })

  return (
    <>
      <DataTable
        data={R.path(['blacklistMessages'], data)}
        elements={elements}
        emptyText="No blacklisted addresses so far"
        name="blacklistTable"
      />
      {selectedMessage && (
        <Modal
          title={`Blacklist message - ${selectedMessage?.label}`}
          open={true}
          width={676}
          height={400}
          handleClose={handleModalClose}>
          <Formik
            validateOnBlur={false}
            validateOnChange={false}
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={values =>
              handleSubmit({ id: selectedMessage.id, ...values })
            }>
            {({ errors, touched, setFieldValue }) => (
              <Form className={classes.advancedForm}>
                <ActionButton
                  color="primary"
                  Icon={DefaultIcon}
                  InverseIcon={DefaultIconReverse}
                  className={classes.resetToDefault}
                  type="button"
                  onClick={() => setFieldValue('content', DEFAULT_MESSAGE)}>
                  Reset to default
                </ActionButton>
                <Field
                  name="content"
                  label="Message content"
                  fullWidth
                  multiline={true}
                  rows={6}
                  component={TextInput}
                />
                <div className={classes.footer}>
                  {getErrorMsg(errors, touched, mutationError) && (
                    <ErrorMessage>
                      {getErrorMsg(errors, touched, mutationError)}
                    </ErrorMessage>
                  )}
                  <Button type="submit" className={classes.submit}>
                    Confirm
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Modal>
      )}
    </>
  )
}

export default BlacklistAdvanced
