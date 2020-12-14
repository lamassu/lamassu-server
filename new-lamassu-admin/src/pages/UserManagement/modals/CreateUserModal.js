import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import { Field, Form, Formik } from 'formik'
import gql from 'graphql-tag'
import React, { useState } from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { TextInput, RadioGroup } from 'src/components/inputs/formik'
import { H1, H2, H3, Info3, Mono } from 'src/components/typography'
import CopyToClipboard from 'src/pages/Transactions/CopyToClipboard'

import styles from '../UserManagement.styles'

const useStyles = makeStyles(styles)

const CREATE_USER = gql`
  mutation createRegisterToken($username: String!, $role: String!) {
    createRegisterToken(username: $username, role: $role) {
      token
      expire
    }
  }
`

const validationSchema = Yup.object().shape({
  username: Yup.string()
    .email('Username field should be in an email format!')
    .required('Username field is required!'),
  role: Yup.string().required('Role field is required!')
})

const initialValues = {
  username: '',
  role: ''
}

const CreateUserModal = ({ showModal, toggleModal }) => {
  const classes = useStyles()

  const [usernameField, setUsernameField] = useState('')
  const [createUserURL, setCreateUserURL] = useState(null)

  const radioOptions = [
    {
      code: 'user',
      display: 'Regular user'
    },
    {
      code: 'superuser',
      display: 'Superuser'
    }
  ]

  const handleClose = () => {
    setCreateUserURL(null)
    toggleModal()
  }

  const [createUser, { error }] = useMutation(CREATE_USER, {
    onCompleted: ({ createRegisterToken: token }) => {
      setCreateUserURL(`https://localhost:3001/register?t=${token.token}`)
    }
  })

  const roleClass = (formikErrors, formikTouched) => ({
    [classes.error]: formikErrors.role && formikTouched.role
  })

  const getErrorMsg = (formikErrors, formikTouched) => {
    if (!formikErrors || !formikTouched) return null
    if (error) return 'Internal server error'
    if (formikErrors.username && formikTouched.username)
      return formikErrors.username
    return null
  }

  return (
    <>
      {showModal && !createUserURL && (
        <Modal
          closeOnBackdropClick={true}
          width={600}
          height={400}
          handleClose={handleClose}
          open={true}>
          <Formik
            validationSchema={validationSchema}
            initialValues={initialValues}
            onSubmit={values => {
              setUsernameField(values.username)
              createUser({
                variables: { username: values.username, role: values.role }
              })
            }}>
            {({ errors, touched }) => (
              <Form id="register-user-form" className={classes.form}>
                <H1 className={classes.modalTitle}>Create new user</H1>
                <Field
                  component={TextInput}
                  name="username"
                  width={338}
                  autoFocus
                  label="User login"
                />
                <H3
                  className={classnames(
                    roleClass(errors, touched),
                    classes.modalLabel2
                  )}>
                  Role
                </H3>
                <Field
                  component={RadioGroup}
                  name="role"
                  labelClassName={classes.radioLabel}
                  className={classes.radioGroup}
                  options={radioOptions}
                />
                <div className={classes.footer}>
                  {getErrorMsg(errors, touched) && (
                    <ErrorMessage>{getErrorMsg(errors, touched)}</ErrorMessage>
                  )}
                  <Button
                    type="submit"
                    form="register-user-form"
                    className={classes.submit}>
                    Finish
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Modal>
      )}
      {showModal && createUserURL && (
        <Modal
          closeOnBackdropClick={true}
          width={600}
          height={275}
          handleClose={handleClose}
          open={true}>
          <H2 className={classes.modalTitle}>Creating {usernameField}...</H2>
          <Info3 className={classes.info}>
            Safely share this link with {usernameField} to finish the
            registration process.
          </Info3>
          <div className={classes.addressWrapper}>
            <Mono className={classes.address}>
              <strong>
                <CopyToClipboard buttonClassname={classes.copyToClipboard}>
                  {createUserURL}
                </CopyToClipboard>
              </strong>
            </Mono>
          </div>
        </Modal>
      )}
    </>
  )
}

export default CreateUserModal
