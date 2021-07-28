import { makeStyles } from '@material-ui/core/styles'
import { Form, Formik, Field } from 'formik'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { Tooltip } from 'src/components/Tooltip'
import { Button } from 'src/components/buttons'
import { NumberInput, Autocomplete } from 'src/components/inputs/formik'
import { H3, TL1, P } from 'src/components/typography'

import styles from './IndividualDiscount.styles'

const useStyles = makeStyles(styles)

const initialValues = {
  customer: '',
  discount: ''
}

const validationSchema = Yup.object().shape({
  customer: Yup.string().required('A customer is required!'),
  discount: Yup.number()
    .required('A discount rate is required!')
    .min(0, 'Discount rate should be a positive number!')
    .max(100, 'Discount rate should have a maximum value of 100%!')
})

const getErrorMsg = (formikErrors, formikTouched, mutationError) => {
  if (!formikErrors || !formikTouched) return null
  if (mutationError) return 'Internal server error'
  if (formikErrors.customer && formikTouched.customer)
    return formikErrors.customer
  if (formikErrors.discount && formikTouched.discount)
    return formikErrors.discount
  return null
}

const IndividualDiscountModal = ({
  showModal,
  setShowModal,
  onClose,
  creationError,
  addDiscount,
  customers
}) => {
  const classes = useStyles()

  const handleAddDiscount = (customer, discount) => {
    addDiscount({
      variables: {
        customerId: customer,
        discount: parseInt(discount)
      }
    })
    setShowModal(false)
  }

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
            onSubmit={({ customer, discount }) => {
              handleAddDiscount(customer, discount)
            }}>
            {({ errors, touched }) => (
              <Form id="individual-discount-form" className={classes.form}>
                <div className={classes.customerAutocomplete}>
                  <Field
                    name="customer"
                    label="Select a customer"
                    component={Autocomplete}
                    fullWidth
                    options={R.map(it => ({
                      code: it.id,
                      display: `${it?.idCardData?.firstName ?? ``}${
                        it?.idCardData?.firstName && it?.idCardData?.lastName
                          ? ` `
                          : ``
                      }${it?.idCardData?.lastName ?? ``} (${it.phone})`
                    }))(customers)}
                    labelProp="display"
                    valueProp="code"
                  />
                </div>
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
