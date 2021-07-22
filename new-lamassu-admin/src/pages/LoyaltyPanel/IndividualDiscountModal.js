import { makeStyles } from '@material-ui/core/styles'
import classNames from 'classnames'
import { Form, Formik, Field } from 'formik'
import React from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { Tooltip } from 'src/components/Tooltip'
import { Button } from 'src/components/buttons'
import {
  NumberInput,
  RadioGroup,
  TextInput
} from 'src/components/inputs/formik'
import { H3, TL1, P } from 'src/components/typography'

import styles from './IndividualDiscount.styles'

const useStyles = makeStyles(styles)

const initialValues = {
  idType: '',
  value: '',
  discount: ''
}

const validationSchema = Yup.object().shape({
  idType: Yup.string()
    .required('An identification type is required!')
    .trim(),
  value: Yup.string()
    .required('A value is required!')
    .trim()
    .min(3, 'Value should have at least 3 characters!')
    .max(20, 'Value should have a maximum of 20 characters!'),
  discount: Yup.number()
    .required('A discount rate is required!')
    .min(0, 'Discount rate should be a positive number!')
    .max(100, 'Discount rate should have a maximum value of 100%!')
})

const radioOptions = [
  {
    code: 'phone',
    display: 'Phone number'
  },
  {
    code: 'idNumber',
    display: 'ID card number'
  }
]

const getErrorMsg = (formikErrors, formikTouched, mutationError) => {
  if (!formikErrors || !formikTouched) return null
  if (mutationError) return 'Internal server error'
  if (formikErrors.idType && formikTouched.idType) return formikErrors.idType
  if (formikErrors.value && formikTouched.value) return formikErrors.value
  if (formikErrors.discount && formikTouched.discount)
    return formikErrors.discount
  return null
}

const IndividualDiscountModal = ({
  showModal,
  setShowModal,
  onClose,
  creationError,
  addDiscount
}) => {
  const classes = useStyles()

  const handleAddDiscount = (idType, value, discount) => {
    addDiscount({
      variables: {
        idType: idType,
        value: value,
        discount: parseInt(discount)
      }
    })
    setShowModal(false)
  }

  const idTypeClass = (formikErrors, formikTouched) => ({
    [classes.error]: formikErrors.idType && formikTouched.idType
  })

  return (
    <>
      {showModal && (
        <Modal
          title="Add individual customer discount"
          closeOnBackdropClick={true}
          width={600}
          height={500}
          handleClose={onClose}
          open={true}>
          <Formik
            validateOnBlur={false}
            validateOnChange={false}
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={({ idType, value, discount }) => {
              handleAddDiscount(idType, value, discount)
            }}>
            {({ values, errors, touched }) => (
              <Form id="individual-discount-form" className={classes.form}>
                <div>
                  <H3 className={classNames(idTypeClass(errors, touched))}>
                    Select customer identification option
                  </H3>
                  <Field
                    component={RadioGroup}
                    name="idType"
                    className={classes.radioGroup}
                    options={radioOptions}
                  />
                </div>
                <Field
                  name="value"
                  label={`Enter customer ${
                    values.idType === 'idNumber' ? `ID` : `phone`
                  } number`}
                  autoFocus
                  size="lg"
                  autoComplete="off"
                  width={338}
                  component={TextInput}
                />
                <div>
                  <div className={classes.discountRateWrapper}>
                    <H3>Define discount rate</H3>
                    <Tooltip width={304}>
                      <P>
                        This is a percentage discount off of your existing
                        commission rates for a customer entering this code at
                        the machine.
                      </P>
                      <P>
                        For instance, if you charge 8% commissions, and this
                        code is set for 50%, then you'll instead be charging 4%
                        on transactions using the code.
                      </P>
                    </Tooltip>
                  </div>
                  <div className={classes.discountInput}>
                    <Field
                      name="discount"
                      size="lg"
                      autoComplete="off"
                      width={50}
                      decimalScale={0}
                      className={classes.discountInputField}
                      component={NumberInput}
                    />
                    <TL1 inline className={classes.inputLabel}>
                      %
                    </TL1>
                  </div>
                </div>
                <div className={classes.footer}>
                  {getErrorMsg(errors, touched, creationError) && (
                    <ErrorMessage>
                      {getErrorMsg(errors, touched, creationError)}
                    </ErrorMessage>
                  )}
                  <Button
                    type="submit"
                    form="individual-discount-form"
                    className={classes.submit}>
                    Add discount
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

export default IndividualDiscountModal
