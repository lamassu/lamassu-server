import { makeStyles } from '@material-ui/core/styles'
import { Field, Form, Formik } from 'formik'
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import { H1 } from 'src/components/typography'
import { spacer, primaryColor, fontPrimary } from 'src/styling/variables'

const styles = {
  modalTitle: {
    marginTop: -5,
    color: primaryColor,
    fontFamily: fontPrimary
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, spacer * 3, 0]]
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  submit: {
    margin: [['auto', 0, 0, 'auto']]
  }
}

const pnUtilInstance = PhoneNumberUtil.getInstance()

const getValidationSchema = countryCodes =>
  Yup.object().shape({
    phoneNumber: Yup.string()
      .required('A phone number is required')
      .test('is-valid-number', 'That is not a valid phone number', value => {
        try {
          const validMap = R.map(it => {
            const number = pnUtilInstance.parseAndKeepRawInput(value, it)
            return pnUtilInstance.isValidNumber(number)
          }, countryCodes)

          return R.any(it => it === true, validMap)
        } catch (e) {}
      })
      .trim()
  })

const formatPhoneNumber = (countryCodes, numberStr) => {
  const matchedCountry = R.find(it => {
    const number = pnUtilInstance.parseAndKeepRawInput(numberStr, it)
    return pnUtilInstance.isValidNumber(number)
  }, countryCodes)

  const matchedNumber = pnUtilInstance.parseAndKeepRawInput(
    numberStr,
    matchedCountry
  )

  return pnUtilInstance.format(matchedNumber, PhoneNumberFormat.E164)
}

const initialValues = {
  phoneNumber: ''
}

const useStyles = makeStyles(styles)

const getErrorMsg = (formikErrors, formikTouched) => {
  if (!formikErrors || !formikTouched) return null
  if (formikErrors.phoneNumber && formikTouched.phoneNumber)
    return formikErrors.phoneNumber
  return null
}

const CreateCustomerModal = ({ showModal, handleClose, onSubmit, locale }) => {
  const classes = useStyles()

  const possibleCountries = R.append(
    locale?.country,
    R.map(it => it.country, locale?.overrides ?? [])
  )

  return (
    <Modal
      closeOnBackdropClick={true}
      width={600}
      height={300}
      handleClose={handleClose}
      open={showModal}>
      <Formik
        validationSchema={getValidationSchema(possibleCountries)}
        initialValues={initialValues}
        validateOnChange={false}
        onSubmit={values => {
          onSubmit({
            variables: {
              phoneNumber: formatPhoneNumber(
                possibleCountries,
                values.phoneNumber
              )
            }
          })
        }}>
        {({ errors, touched }) => (
          <Form id="customer-registration-form" className={classes.form}>
            <H1 className={classes.modalTitle}>Create new customer</H1>
            <Field
              component={TextInput}
              name="phoneNumber"
              width={338}
              autoFocus
              label="Phone number"
            />
            <div className={classes.footer}>
              {getErrorMsg(errors, touched) && (
                <ErrorMessage>{getErrorMsg(errors, touched)}</ErrorMessage>
              )}
              <Button
                type="submit"
                form="customer-registration-form"
                className={classes.submit}>
                Finish
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  )
}

export default CreateCustomerModal
