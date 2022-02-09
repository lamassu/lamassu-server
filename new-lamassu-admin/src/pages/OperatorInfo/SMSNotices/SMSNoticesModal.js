import { makeStyles, Chip } from '@material-ui/core'
import { Form, Formik, Field } from 'formik'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'

import styles from './SMSNotices.styles'

const useStyles = makeStyles(styles)

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
        name: 'has-code',
        message: 'The confirmation code is missing from the message!',
        exclusive: false,
        test: value => value?.match(/#code/g || [])?.length > 0
      })
      .test({
        name: 'has-single-code',
        message: 'There should be a single confirmation code!',
        exclusive: false,
        test: value => value?.match(/#code/g || [])?.length === 1
      })
  },
  cashOutDispenseReady: {
    validator: Yup.string()
      .required('The message content is required!')
      .trim()
    // .test({
    //   name: 'has-timestamp-tag',
    //   message: 'A #timestamp tag is missing from the message!',
    //   exclusive: false,
    //   test: value => value?.match(/#timestamp/g || [])?.length > 0
    // })
    // .test({
    //   name: 'has-single-timestamp-tag',
    //   message: 'There should be a single #timestamp tag!',
    //   exclusive: false,
    //   test: value => value?.match(/#timestamp/g || [])?.length === 1
    // })
  }
}

const chips = {
  smsCode: [{ code: '#code', display: 'Confirmation code', removable: false }],
  cashOutDispenseReady: []
}

const SMSNoticesModal = ({
  showModal,
  onClose,
  sms,
  creationError,
  submit
}) => {
  const classes = useStyles()

  const initialValues = {
    event: !R.isNil(sms) ? sms.event : '',
    message: !R.isNil(sms) ? sms.message : ''
  }

  const validationSchema = Yup.object().shape({
    event: Yup.string().required('An event is required!'),
    message:
      prefill[sms?.event]?.validator ??
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
            message: values.message
          }
        })
      : submit({
          variables: {
            event: values.event,
            message: values.message
          }
        })
    onClose()
  }

  return (
    <>
      {showModal && (
        <Modal
          title={`Edit SMS notice`}
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
            {({ values, errors, touched, setFieldValue }) => (
              <Form id="sms-notice" className={classes.form}>
                <Field
                  name="message"
                  label="Message content"
                  fullWidth
                  multiline={true}
                  rows={6}
                  component={TextInput}
                />
                {R.map(
                  it => (
                    <Chip
                      label={it.display}
                      onClick={() => {
                        R.includes(it.code, values.message)
                          ? setFieldValue('message', values.message)
                          : setFieldValue(
                              'message',
                              values.message.concat(' ', it.code, ' ')
                            )
                      }}
                    />
                  ),
                  chips[sms?.event]
                )}
                <div className={classes.footer}>
                  {getErrorMsg(errors, touched, creationError) && (
                    <ErrorMessage>
                      {getErrorMsg(errors, touched, creationError)}
                    </ErrorMessage>
                  )}
                  <Button
                    type="submit"
                    form="sms-notice"
                    className={classes.submit}>
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

export default SMSNoticesModal
