import { makeStyles } from '@material-ui/core/styles'
import { Form, Formik, Field } from 'formik'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { Tooltip } from 'src/components/Tooltip'
import { Button } from 'src/components/buttons'
import { TextInput, NumberInput } from 'src/components/inputs/formik'
import { H3, TL1, P } from 'src/components/typography'

import styles from './PromoCodes.styles'

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

const PromoCodesModal = ({ showModal, onClose, errorMsg, addCode }) => {
  const classes = useStyles()

  const handleAddCode = (code, discount) => {
    addCode(R.toUpper(code), parseInt(discount))
  }

  return (
    <>
      {showModal && (
        <Modal
          title="Add promo code discount"
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
            onSubmit={({ code, discount }) => {
              handleAddCode(code, discount)
            }}>
            <Form id="promo-form" className={classes.form}>
              <H3 className={classes.modalLabel1}>Promo code name</H3>
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
                    This is a percentage discount off of your existing
                    commission rates for a customer entering this code at the
                    machine.
                  </P>
                  <P>
                    For instance, if you charge 8% commissions, and this code is
                    set for 50%, then you'll instead be charging 4% on
                    transactions using the code.
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
              <div className={classes.footer}>
                {errorMsg && <ErrorMessage>{errorMsg}</ErrorMessage>}
                <Button
                  type="submit"
                  form="promo-form"
                  className={classes.submit}>
                  Add code
                </Button>
              </div>
            </Form>
          </Formik>
        </Modal>
      )}
    </>
  )
}

export default PromoCodesModal
