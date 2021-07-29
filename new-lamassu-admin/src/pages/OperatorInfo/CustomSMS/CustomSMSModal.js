import { Form, Formik, Field } from 'formik'
import React from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'
import { Autocomplete } from 'src/components/inputs/formik'

const EVENT_OPTIONS = [
  { code: 'sms_code', display: 'On SMS confirmation code' },
  { code: 'cash_out_dispense_ready', display: 'Cash out dispense ready' }
]

const CustomSMSModal = ({
  showModal,
  onClose,
  customMessage,
  machineOptions
}) => {
  const initialValues = {
    event: '',
    device: '',
    message: ''
  }

  const validationSchema = {
    event: Yup.string().required('An event is required!'),
    device: Yup.string(),
    message: Yup.string()
      .required('The message content is required!')
      .trim()
  }

  return (
    <>
      {showModal && (
        <Modal
          title="Add custom SMS"
          closeOnBackdropClick={true}
          width={600}
          height={500}
          open={true}
          handleClose={onClose}>
          <Formik
            validateOnBlur={false}
            validateOnChange={false}
            initialValues={initialValues}
            validationSchema={validationSchema}>
            <Form id="custom-sms">
              <Field
                name="event"
                fullWidth
                options={EVENT_OPTIONS}
                labelProp="display"
                valueProp="code"
                component={Autocomplete}
              />
              <Field
                name="device"
                fullWidth
                options={machineOptions}
                labelProp="display"
                valueProp="code"
                component={Autocomplete}
              />
            </Form>
          </Formik>
        </Modal>
      )}
    </>
  )
}

export default CustomSMSModal
