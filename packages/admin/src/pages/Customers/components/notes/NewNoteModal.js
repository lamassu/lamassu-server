import { makeStyles } from '@material-ui/core/styles'
import { Form, Formik, Field } from 'formik'
import { React } from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'

import styles from './NewNoteModal.styles'

const useStyles = makeStyles(styles)

const initialValues = {
  title: '',
  content: ''
}

const validationSchema = Yup.object().shape({
  title: Yup.string()
    .required()
    .trim()
    .max(25),
  content: Yup.string().required()
})

const NewNoteModal = ({ showModal, onClose, onSubmit, errorMsg }) => {
  const classes = useStyles()

  return (
    <>
      <Modal
        title="New note"
        closeOnBackdropClick={true}
        width={416}
        height={472}
        handleClose={onClose}
        open={showModal}>
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={({ title, content }) => {
            onSubmit({ title, content })
          }}>
          <Form id="note-form" className={classes.form}>
            <Field
              name="title"
              autofocus
              size="md"
              autoComplete="off"
              width={350}
              component={TextInput}
              label="Note title"
            />
            <Field
              name="content"
              size="sm"
              autoComplete="off"
              width={350}
              component={TextInput}
              multiline={true}
              rows={11}
              label="Note content"
            />
            <div className={classes.footer}>
              {errorMsg && <ErrorMessage>{errorMsg}</ErrorMessage>}
              <Button type="submit" form="note-form" className={classes.submit}>
                Add note
              </Button>
            </div>
          </Form>
        </Formik>
      </Modal>
    </>
  )
}

export default NewNoteModal
