import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Grid } from '@material-ui/core'
import Paper from '@material-ui/core/Paper'
import { Field, Form, Formik } from 'formik'
import gql from 'graphql-tag'
import React, { useReducer } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import * as Yup from 'yup'

import { Button } from 'src/components/buttons'
import { SecretInput } from 'src/components/inputs/formik'
import { H2, Label2, P } from 'src/components/typography'
import { ReactComponent as Logo } from 'src/styling/icons/menu/logo.svg'

import styles from './Login.styles'

const QueryParams = () => new URLSearchParams(useLocation().search)
const useStyles = makeStyles(styles)

const VALIDATE_REGISTER_LINK = gql`
  query validateRegisterLink($token: String!) {
    validateRegisterLink(token: $token) {
      username
      role
    }
  }
`

const REGISTER = gql`
  mutation register(
    $token: String!
    $username: String!
    $password: String!
    $role: String!
  ) {
    register(
      token: $token
      username: $username
      password: $password
      role: $role
    )
  }
`

const validationSchema = Yup.object().shape({
  password: Yup.string()
    .required('A password is required')
    .test(
      'len',
      'Your password must contain more than 8 characters',
      val => val.length >= 8
    ),
  confirmPassword: Yup.string().oneOf(
    [Yup.ref('password'), null],
    'Passwords must match'
  )
})

const initialValues = {
  password: '',
  confirmPassword: ''
}

const Register = () => {
  const classes = useStyles()
  const history = useHistory()
  const token = QueryParams().get('t')

  const initialState = {
    username: null,
    role: null,
    wasSuccessful: false
  }

  const reducer = (state, action) => {
    const { type, payload } = action
    return { ...state, [type]: payload }
  }

  const [state, dispatch] = useReducer(reducer, initialState)

  const { error: queryError, loading } = useQuery(VALIDATE_REGISTER_LINK, {
    variables: { token: token },
    onCompleted: ({ validateRegisterLink: info }) => {
      if (!info) {
        dispatch({ type: 'wasSuccessful', payload: false })
      } else {
        dispatch({ type: 'wasSuccessful', payload: true })
        dispatch({ type: 'username', payload: info.username })
        dispatch({ type: 'role', payload: info.role })
      }
    },
    onError: () => {
      dispatch({ type: 'wasSuccessful', payload: false })
    }
  })

  const [register, { error: mutationError }] = useMutation(REGISTER, {
    onCompleted: ({ register: success }) => {
      if (success) history.push('/wizard', { fromAuthRegister: true })
    }
  })

  const getErrorMsg = (formikErrors, formikTouched) => {
    if (!formikErrors || !formikTouched) return null
    if (queryError || mutationError) return 'Internal server error'
    if (formikErrors.password && formikTouched.password)
      return formikErrors.password
    if (formikErrors.confirmPassword && formikTouched.confirmPassword)
      return formikErrors.confirmPassword
    return null
  }

  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justify="center"
      className={classes.welcomeBackground}>
      <Grid>
        <div>
          <Paper elevation={1}>
            <div className={classes.wrapper}>
              <div className={classes.titleWrapper}>
                <Logo className={classes.icon} />
                <H2 className={classes.title}>Lamassu Admin</H2>
              </div>
              {!loading && state.wasSuccessful && (
                <Formik
                  validationSchema={validationSchema}
                  initialValues={initialValues}
                  onSubmit={values => {
                    register({
                      variables: {
                        token: token,
                        username: state.username,
                        password: values.password,
                        role: state.role
                      }
                    })
                  }}>
                  {({ errors, touched }) => (
                    <Form id="register-form">
                      <Field
                        name="password"
                        label="Insert a password"
                        autoFocus
                        component={SecretInput}
                        size="lg"
                        fullWidth
                        className={classes.input}
                      />
                      <Field
                        name="confirmPassword"
                        label="Confirm your password"
                        component={SecretInput}
                        size="lg"
                        fullWidth
                      />
                      <div className={classes.footer}>
                        {getErrorMsg(errors, touched) && (
                          <P className={classes.errorMessage}>
                            {getErrorMsg(errors, touched)}
                          </P>
                        )}
                        <Button
                          type="submit"
                          form="register-form"
                          buttonClassName={classes.loginButton}>
                          Done
                        </Button>
                      </div>
                    </Form>
                  )}
                </Formik>
              )}
              {!loading && !state.wasSuccessful && (
                <>
                  <Label2 className={classes.inputLabel}>
                    Link has expired
                  </Label2>
                </>
              )}
            </div>
          </Paper>
        </div>
      </Grid>
    </Grid>
  )
}

export default Register
