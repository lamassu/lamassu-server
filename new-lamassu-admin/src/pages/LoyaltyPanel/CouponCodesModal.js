import { makeStyles } from '@material-ui/core/styles'
import { Form, Formik, Field } from 'formik'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'
import { Tooltip } from 'src/components/Tooltip'
import { Button } from 'src/components/buttons'
import { TextInput, NumberInput } from 'src/components/inputs/formik'
import { H3, TL1, P } from 'src/components/typography'

import styles from './CouponCodes.styles'

const useStyles = makeStyles(styles)

const initialValues = {
  code: '',
  discount: ''
}

const validationSchema = Yup.object().shape({
  code: Yup.string()
    .required()
    .trim()
    .max(25),
  discount: Yup.number()
    .required()
    .min(0)
    .max(100)
})

const CouponCodesModal = ({ showModal, onClose, errorMsg, addCoupon }) => {
  const classes = useStyles()

  const handleAddCoupon = (code, discount) => {
    addCoupon(R.toUpper(code), parseInt(discount))
  }

  return (
    <>
      {showModal && (
        <Modal
          title="Add coupon code discount"
          closeOnBackdropClick={true}
          width={600}
          height={500}
          handleClose={onClose}
          open={true}>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={({ code, discount }, { resetForm }) => {
              handleAddCoupon(code, discount)
              resetForm()
            }}>
            <Form id="coupon-form" className={classes.form}>
              <H3 className={classes.modalLabel1}>Coupon code name</H3>
              <Field
                name="code"
                autoFocus
                size="lg"
                autoComplete="off"
                width={338}
                inputProps={{ style: { textTransform: 'uppercase' } }}
                component={TextInput}
              />
              <div className={classes.modalLabel2Wrapper}>
                <H3 className={classes.modalLabel2}>Define discount rate</H3>
                <Tooltip width={304}>
                  <P>
                    The discount rate inserted will be applied to the
                    commissions of all transactions performed with this
                    respective coupon code.
                  </P>
                  <P>
                    (It should be a number between 0 (zero) and 100 (one
                    hundred)).
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
              <span className={classes.error}>{errorMsg}</span>
              <div className={classes.footer}>
                <Button type="submit" form="coupon-form">
                  Add coupon
                </Button>
              </div>
            </Form>
          </Formik>
        </Modal>
      )}
    </>
  )
}

export default CouponCodesModal
