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
import { Label3, P } from 'src/components/typography'
import { ReactComponent as Logo } from 'src/styling/icons/menu/pazuzBig.svg'

import styles from './shared.styles'

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

const PASSWORD_MIN_LENGTH = 8
const validationSchema = Yup.object({
  password: Yup.string()
    .required('A password is required')
    .min(
      PASSWORD_MIN_LENGTH,
      `Your password must contain at least ${PASSWORD_MIN_LENGTH} characters`
    ),
  confirmPassword: Yup.string()
    .required('Please confirm the password')
    .oneOf([Yup.ref('password')], 'Passwords must match')
})

const initialValues = {
  password: '',
  confirmPassword: ''
}

const initialState = {
  username: null,
  role: null,
  result: ''
}

const reducer = (state, action) => {
  const { type, payload } = action
  return { ...state, ...payload, result: type }
}

const getErrorMsg = (
  formikErrors,
  formikTouched,
  queryError,
  mutationError
) => {
  if (!formikErrors || !formikTouched) return null
  if (queryError || mutationError) return 'Internal server error'
  if (formikErrors.password && formikTouched.password)
    return formikErrors.password
  if (formikErrors.confirmPassword && formikTouched.confirmPassword)
    return formikErrors.confirmPassword
  return null
}

const Register = () => {
  const classes = useStyles()
  const history = useHistory()
  const token = QueryParams().get('t')
  const identifier = QueryParams().get('id') ?? null

  const [state, dispatch] = useReducer(reducer, initialState)

  const queryOptions = {
    context: {
      headers: {
        'Pazuz-Operator-Identifier': identifier
      }
    },
    variables: { token: token },
    onCompleted: ({ validateRegisterLink: info }) => {
      if (!info) {
        return dispatch({
          type: 'failure'
        })
      }
      dispatch({
        type: 'success',
        payload: {
          username: info.username,
          role: info.role
        }
      })
    },
    onError: () =>
      dispatch({
        type: 'failure'
      })
  }

  const { error: queryError, loading } = useQuery(
    VALIDATE_REGISTER_LINK,
    queryOptions
  )

  const [register, { error: mutationError }] = useMutation(REGISTER, {
    onCompleted: ({ register: success }) => {
      if (success) history.push('/wizard', { fromAuthRegister: true })
    }
  })

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
              </div>
              {!loading && state.result === 'success' && (
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
                        {getErrorMsg(
                          errors,
                          touched,
                          queryError,
                          mutationError
                        ) && (
                          <P className={classes.errorMessage}>
                            {getErrorMsg(
                              errors,
                              touched,
                              queryError,
                              mutationError
                            )}
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
              {!loading && state.result === 'failure' && (
                <>
                  <Label3>Link has expired</Label3>
                  <Label3>
                    To obtain a new link, run the command{' '}
                    <strong>lamassu-register</strong> in your server’s terminal.
                  </Label3>
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
