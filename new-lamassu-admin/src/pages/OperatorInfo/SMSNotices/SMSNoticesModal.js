import { makeStyles, Chip } from '@material-ui/core'
import { Form, Formik, Field } from 'formik'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { ActionButton, Button } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import { Info2 } from 'src/components/typography'
import { ReactComponent as DefaultIconReverse } from 'src/styling/icons/button/retry/white.svg'
import { ReactComponent as DefaultIcon } from 'src/styling/icons/button/retry/zodiac.svg'
import { zircon } from 'src/styling/variables'

import styles from './SMSNotices.styles'

const useStyles = makeStyles(styles)

const getErrorMsg = (formikErrors, formikTouched, mutationError) => {
  if (!formikErrors || !formikTouched) return null
  if (mutationError) return 'Internal server error'
  if (formikErrors.event && formikTouched.event) return formikErrors.event
  if (formikErrors.message && formikTouched.message) return formikErrors.message
  return null
}

const PREFILL = {
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
  },
  smsReceipt: {
    validator: Yup.string().trim()
  }
}

const CHIPS = {
  smsCode: [
    { code: '#code', display: 'Confirmation code', obligatory: true },
    { code: '#timestamp', display: 'Timestamp', obligatory: false }
  ],
  cashOutDispenseReady: [
    { code: '#timestamp', display: 'Timestamp', obligatory: false }
  ],
  smsReceipt: [{ code: '#timestamp', display: 'Timestamp', obligatory: false }]
}

const DEFAULT_MESSAGES = {
  smsCode: 'Your cryptomat code: #code',
  cashOutDispenseReady:
    'Your cash is waiting! Go to the Cryptomat and press Redeem within 24 hours. [#timestamp]',
  smsReceipt: ''
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
      PREFILL[sms?.event]?.validator ??
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
          title={`SMS notice - ${sms?.messageName}`}
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
                <ActionButton
                  color="primary"
                  Icon={DefaultIcon}
                  InverseIcon={DefaultIconReverse}
                  className={classes.resetToDefault}
                  type="button"
                  onClick={() =>
                    setFieldValue('message', DEFAULT_MESSAGES[sms?.event])
                  }>
                  Reset to default
                </ActionButton>
                <Field
                  name="message"
                  label="Message content"
                  fullWidth
                  multiline={true}
                  rows={6}
                  component={TextInput}
                />
                {R.length(CHIPS[sms?.event]) > 0 && (
                  <Info2 noMargin>Values to attach</Info2>
                )}
                <div className={classes.chipButtons}>
                  {R.map(
                    it => (
                      <div>
                        {R.map(
                          ite => (
                            <Chip
                              label={ite.display}
                              size="small"
                              style={{ backgroundColor: zircon }}
                              disabled={R.includes(ite.code, values.message)}
                              className={classes.chip}
                              onClick={() => {
                                setFieldValue(
                                  'message',
                                  values.message.concat(
                                    R.last(values.message) === ' ' ? '' : ' ',
                                    ite.code
                                  )
                                )
                              }}
                            />
                          ),
                          it
                        )}
                      </div>
                    ),
                    R.splitEvery(3, CHIPS[sms?.event])
                  )}
                </div>
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
