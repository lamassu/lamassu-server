import { makeStyles } from '@material-ui/core'
import { Form, Formik, Field } from 'formik'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { Autocomplete, TextInput } from 'src/components/inputs/formik'

import styles from './CustomSMS.styles'

const useStyles = makeStyles(styles)

const ALL_MACHINES = {
  code: 'ALL_MACHINES',
  display: 'All Machines'
}

const getErrorMsg = (formikErrors, formikTouched, mutationError) => {
  if (!formikErrors || !formikTouched) return null
  if (mutationError) return 'Internal server error'
  if (formikErrors.event && formikTouched.event) return formikErrors.event
  if (formikErrors.message && formikTouched.message) return formikErrors.message
  return null
}

const prefill = {
  smsCode: {
    validator: Yup.string()
      .required('The message content is required!')
      .trim()
      .test({
        name: 'has-code-tag',
        message: 'A #code tag is missing from the message!',
        exclusive: false,
        test: value => value?.match(/#code/g || [])?.length > 0
      })
      .test({
        name: 'has-single-code-tag',
        message: 'There should be a single #code tag!',
        exclusive: false,
        test: value => value?.match(/#code/g || [])?.length === 1
      })
  },
  cashOutDispenseReady: {
    validator: Yup.string()
      .required('The message content is required!')
      .trim()
      .test({
        name: 'has-timestamp-tag',
        message: 'A #timestamp tag is missing from the message!',
        exclusive: false,
        test: value => value?.match(/#timestamp/g || [])?.length > 0
      })
      .test({
        name: 'has-single-timestamp-tag',
        message: 'There should be a single #timestamp tag!',
        exclusive: false,
        test: value => value?.match(/#timestamp/g || [])?.length === 1
      })
  }
}

const CustomSMSModal = ({
  showModal,
  onClose,
  sms,
  machineOptions,
  eventOptions,
  creationError,
  submit
}) => {
  const classes = useStyles()

  const [selectedEvent, setSelectedEvent] = useState(sms?.event)

  const initialValues = {
    event: !R.isNil(sms) ? sms.event : '',
    device: !R.isNil(sms)
      ? !R.isNil(sms.deviceId)
        ? sms.deviceId
        : 'ALL_MACHINES'
      : '',
    message: !R.isNil(sms) ? sms.message : ''
  }

  const validationSchema = Yup.object().shape({
    event: Yup.string().required('An event is required!'),
    device: Yup.string().required('A machine is required!'),
    message:
      prefill[selectedEvent]?.validator ??
      Yup.string()
        .required('The message content is required!')
        .trim()
  })

  const handleSubmit = values => {
    sms
      ? submit({
          variables: {
            id: sms.id,
            event: values.event,
            deviceId: values.device,
            message: values.message
          }
        })
      : submit({
          variables: {
            event: values.event,
            deviceId: values.device,
            message: values.message
          }
        })
    onClose()
  }

  return (
    <>
      {showModal && (
        <Modal
          title={!R.isNil(sms) ? `Edit custom SMS` : `Add custom SMS`}
          closeOnBackdropClick={true}
          width={600}
          height={500}
          open={true}
          handleClose={onClose}>
          <Formik
            validateOnBlur={false}
            validateOnChange={false}
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values, errors, touched) =>
              handleSubmit(values, errors, touched)
            }>
            {({ values, errors, touched }) => (
              <Form id="custom-sms" className={classes.form}>
                <Field
                  name="event"
                  label="Event"
                  fullWidth
                  onChange={setSelectedEvent(values.event)}
                  options={eventOptions}
                  labelProp="display"
                  valueProp="code"
                  component={Autocomplete}
                />
                <Field
                  name="device"
                  label="Machine"
                  fullWidth
                  options={[ALL_MACHINES].concat(machineOptions)}
                  labelProp="display"
                  valueProp="code"
                  component={Autocomplete}
                />
                <Field
                  name="message"
                  label="Message content"
                  fullWidth
                  multiline={true}
                  rows={6}
                  component={TextInput}
                />
                <div className={classes.footer}>
                  {getErrorMsg(errors, touched, creationError) && (
                    <ErrorMessage>
                      {getErrorMsg(errors, touched, creationError)}
                    </ErrorMessage>
                  )}
                  <Button
                    type="submit"
                    form="custom-sms"
                    className={classes.submit}>
                    {!R.isNil(sms) ? `Confirm` : `Create SMS`}
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

export default CustomSMSModal
