import { useQuery, useMutation, useLazyQuery } from '@apollo/react-hooks'
import { makeStyles, Box, Chip } from '@material-ui/core'
import { startAttestation } from '@simplewebauthn/browser'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useReducer, useState, useContext } from 'react'

import AppContext from 'src/AppContext'
import { Link } from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'

import styles from './UserManagement.styles'
import ChangeRoleModal from './modals/ChangeRoleModal'
import CreateUserModal from './modals/CreateUserModal'
import EnableUserModal from './modals/EnableUserModal'
import Reset2FAModal from './modals/Reset2FAModal'
import ResetPasswordModal from './modals/ResetPasswordModal'

const useStyles = makeStyles(styles)

const GET_USERS = gql`
  query users {
    users {
      id
      username
      role
      enabled
      last_accessed
      last_accessed_from
      last_accessed_address
    }
  }
`

const GENERATE_ATTESTATION = gql`
  query generateAttestationOptions($userID: ID!) {
    generateAttestationOptions(userID: $userID)
  }
`

const VALIDATE_ATTESTATION = gql`
  mutation validateAttestation(
    $userID: ID!
    $attestationResponse: JSONObject!
  ) {
    validateAttestation(
      userID: $userID
      attestationResponse: $attestationResponse
    )
  }
`

const initialState = {
  showCreateUserModal: false,
  showResetPasswordModal: false,
  showReset2FAModal: false,
  showRoleModal: false,
  showEnableUserModal: false
}

const reducer = (_, action) => {
  const { type, payload } = action
  switch (type) {
    case 'close':
      return initialState
    case 'open':
      return { ...initialState, [payload]: true }
    default:
      return initialState
  }
}

const Users = () => {
  const classes = useStyles()
  const { userData } = useContext(AppContext)

  const { data: userResponse } = useQuery(GET_USERS)
  const [state, dispatch] = useReducer(reducer, initialState)

  const [userInfo, setUserInfo] = useState(null)

  const [validateAttestation] = useMutation(VALIDATE_ATTESTATION, {
    onCompleted: res => {
      // TODO: show a brief popup to have UX feedback?
    }
  })

  const [generateAttestationOptions] = useLazyQuery(GENERATE_ATTESTATION, {
    onCompleted: ({ generateAttestationOptions: options }) => {
      startAttestation(options).then(res => {
        validateAttestation({
          variables: {
            userID: userInfo.id,
            attestationResponse: res
          }
        })
      })
    }
  })

  const elements = [
    {
      header: 'Login',
      width: 257,
      textAlign: 'left',
      size: 'sm',
      view: u => {
        if (userData.id === u.id)
          return (
            <>
              {u.username}
              <Chip size="small" label="You" className={classes.chip} />
            </>
          )
        return u.username
      }
    },
    {
      header: 'Role',
      width: 105,
      textAlign: 'center',
      size: 'sm',
      view: u => {
        switch (u.role) {
          case 'user':
            return 'Regular'
          case 'superuser':
            return 'Superuser'
          default:
            return u.role
        }
      }
    },
    {
      header: '',
      width: 80,
      textAlign: 'center',
      size: 'sm',
      view: u => (
        <Switch
          disabled={userData.id === u.id}
          checked={u.role === 'superuser'}
          onClick={() => {
            setUserInfo(u)
            dispatch({
              type: 'open',
              payload: 'showRoleModal'
            })
          }}
          value={u.role === 'superuser'}
        />
      )
    },
    {
      header: '',
      width: 25,
      textAlign: 'center',
      size: 'sm',
      view: u => {}
    },
    {
      header: 'Actions',
      width: 565,
      textAlign: 'left',
      size: 'sm',
      view: u => {
        return (
          <>
            <Chip
              size="small"
              label="Reset password"
              className={classes.actionChip}
              onClick={() => {
                setUserInfo(u)
                dispatch({
                  type: 'open',
                  payload: 'showResetPasswordModal'
                })
              }}
            />
            <Chip
              size="small"
              label="Reset 2FA"
              className={classes.actionChip}
              onClick={() => {
                setUserInfo(u)
                dispatch({
                  type: 'open',
                  payload: 'showReset2FAModal'
                })
              }}
            />
            <Chip
              size="small"
              label="Add FIDO"
              className={classes.actionChip}
              onClick={() => {
                setUserInfo(u)
                generateAttestationOptions({
                  variables: {
                    userID: u.id
                  }
                })
              }}
            />
          </>
        )
      }
    },
    {
      header: 'Enabled',
      width: 100,
      textAlign: 'center',
      size: 'sm',
      view: u => (
        <Switch
          disabled={userData.id === u.id}
          checked={u.enabled}
          onClick={() => {
            setUserInfo(u)
            dispatch({
              type: 'open',
              payload: 'showEnableUserModal'
            })
          }}
          value={u.enabled}
        />
      )
    }
  ]

  return (
    <>
      <TitleSection title="User Management" />
      <Box
        marginBottom={3}
        marginTop={-5}
        className={classes.tableWidth}
        display="flex"
        justifyContent="flex-end">
        <Link
          color="primary"
          onClick={() => {
            dispatch({
              type: 'open',
              payload: 'showCreateUserModal'
            })
          }}>
          Add new user
        </Link>
      </Box>
      <DataTable elements={elements} data={R.path(['users'])(userResponse)} />
      <CreateUserModal state={state} dispatch={dispatch} />
      <ResetPasswordModal
        state={state}
        dispatch={dispatch}
        user={userInfo}
        requiresConfirmation={userInfo?.role === 'superuser'}
      />
      <Reset2FAModal
        state={state}
        dispatch={dispatch}
        user={userInfo}
        requiresConfirmation={userInfo?.role === 'superuser'}
      />
      <ChangeRoleModal
        state={state}
        dispatch={dispatch}
        user={userInfo}
        requiresConfirmation={userInfo?.role === 'superuser'}
      />
      <EnableUserModal
        state={state}
        dispatch={dispatch}
        user={userInfo}
        requiresConfirmation={userInfo?.role === 'superuser'}
      />
    </>
  )
}

export default Users
