import { useQuery, useMutation, useLazyQuery } from '@apollo/react-hooks'
import { makeStyles, Box, Chip } from '@material-ui/core'
import { startAttestation } from '@simplewebauthn/browser'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useReducer, useState, useContext } from 'react'

import AppContext from 'src/AppContext'
import { ActionButton, Link } from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as WhiteKeyIcon } from 'src/styling/icons/button/key/white.svg'
import { ReactComponent as KeyIcon } from 'src/styling/icons/button/key/zodiac.svg'
import { ReactComponent as WhiteLockIcon } from 'src/styling/icons/button/lock/white.svg'
import { ReactComponent as LockIcon } from 'src/styling/icons/button/lock/zodiac.svg'
import { ReactComponent as WhiteUserRoleIcon } from 'src/styling/icons/button/user-role/white.svg'
import { ReactComponent as UserRoleIcon } from 'src/styling/icons/button/user-role/zodiac.svg'
import { IP_CHECK_REGEX } from 'src/utils/constants'

import styles from './UserManagement.styles'
import ChangeRoleModal from './modals/ChangeRoleModal'
import CreateUserModal from './modals/CreateUserModal'
import EnableUserModal from './modals/EnableUserModal'
import FIDOModal from './modals/FIDOModal'
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
  query generateAttestationOptions($userID: ID!, $domain: String!) {
    generateAttestationOptions(userID: $userID, domain: $domain)
  }
`

const VALIDATE_ATTESTATION = gql`
  mutation validateAttestation(
    $userID: ID!
    $attestationResponse: JSONObject!
    $domain: String!
  ) {
    validateAttestation(
      userID: $userID
      attestationResponse: $attestationResponse
      domain: $domain
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

const roleMapper = {
  user: 'Regular',
  superuser: 'Superuser'
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
      return startAttestation(options).then(res => {
        validateAttestation({
          variables: {
            userID: userInfo.id,
            attestationResponse: res,
            domain: window.location.hostname
          }
        })
      })
    }
  })

  const elements = [
    {
      header: 'Login',
      width: 307,
      textAlign: 'left',
      size: 'sm',
      view: u => {
        if (userData.id === u.id)
          return (
            <div className={classes.loginWrapper}>
              <span className={classes.username}>{u.username}</span>
              <Chip size="small" label="You" className={classes.chip} />
            </div>
          )
        return <span className={classes.username}>{u.username}</span>
      }
    },
    {
      header: 'Role',
      width: 160,
      textAlign: 'left',
      size: 'sm',
      view: u => (
        <div className={classes.loginWrapper}>
          <span>{roleMapper[u.role]}</span>
          <Switch
            className={classes.roleSwitch}
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
        </div>
      )
    },
    {
      header: 'Actions',
      width: 565,
      textAlign: 'left',
      size: 'sm',
      view: u => {
        return (
          <div className={classes.actionButtonWrapper}>
            <ActionButton
              Icon={KeyIcon}
              InverseIcon={WhiteKeyIcon}
              color="primary"
              onClick={() => {
                setUserInfo(u)
                dispatch({
                  type: 'open',
                  payload: 'showResetPasswordModal'
                })
              }}>
              Reset password
            </ActionButton>
            <ActionButton
              Icon={LockIcon}
              InverseIcon={WhiteLockIcon}
              color="primary"
              onClick={() => {
                setUserInfo(u)
                dispatch({
                  type: 'open',
                  payload: 'showReset2FAModal'
                })
              }}>
              Reset 2FA
            </ActionButton>
            <ActionButton
              Icon={UserRoleIcon}
              InverseIcon={WhiteUserRoleIcon}
              color="primary"
              onClick={() => {
                if (IP_CHECK_REGEX.test(window.location.hostname)) {
                  dispatch({
                    type: 'open',
                    payload: 'showFIDOModal'
                  })
                } else {
                  setUserInfo(u)
                  generateAttestationOptions({
                    variables: {
                      userID: u.id,
                      domain: window.location.hostname
                    }
                  })
                }
              }}>
              Add FIDO
            </ActionButton>
          </div>
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
      <FIDOModal state={state} dispatch={dispatch} />
    </>
  )
}

export default Users
