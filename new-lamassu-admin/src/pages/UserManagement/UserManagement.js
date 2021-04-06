import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box, Chip } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState, useContext } from 'react'

import AppContext from 'src/AppContext'
import { Link } from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'

import styles from './UserManagement.styles'
import ChangeRoleModal from './modals/ChangeRoleModal'
import CreateUserModal from './modals/CreateUserModal'
import EnableUserModal from './modals/EnableUserModal'
import Input2FAModal from './modals/Input2FAModal'
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

const CHANGE_USER_ROLE = gql`
  mutation changeUserRole($id: ID!, $newRole: String!) {
    changeUserRole(id: $id, newRole: $newRole) {
      id
    }
  }
`

const ENABLE_USER = gql`
  mutation enableUser($id: ID!) {
    enableUser(id: $id) {
      id
    }
  }
`

const DISABLE_USER = gql`
  mutation disableUser($id: ID!) {
    disableUser(id: $id) {
      id
    }
  }
`

const CREATE_RESET_PASSWORD_TOKEN = gql`
  mutation createResetPasswordToken($userID: ID!) {
    createResetPasswordToken(userID: $userID) {
      token
      user_id
      expire
    }
  }
`

const CREATE_RESET_2FA_TOKEN = gql`
  mutation createReset2FAToken($userID: ID!) {
    createReset2FAToken(userID: $userID) {
      token
      user_id
      expire
    }
  }
`

const Users = () => {
  const classes = useStyles()

  const { userData } = useContext(AppContext)

  const { data: userResponse } = useQuery(GET_USERS)

  const [changeUserRole] = useMutation(CHANGE_USER_ROLE, {
    refetchQueries: () => ['users']
  })

  const [enableUser] = useMutation(ENABLE_USER, {
    refetchQueries: () => ['users']
  })

  const [disableUser] = useMutation(DISABLE_USER, {
    refetchQueries: () => ['users']
  })

  const [createResetPasswordToken] = useMutation(CREATE_RESET_PASSWORD_TOKEN, {
    onCompleted: ({ createResetPasswordToken: token }) => {
      setResetPasswordUrl(
        `https://localhost:3001/resetpassword?t=${token.token}`
      )
      toggleResetPasswordModal()
    }
  })

  const [createReset2FAToken] = useMutation(CREATE_RESET_2FA_TOKEN, {
    onCompleted: ({ createReset2FAToken: token }) => {
      setReset2FAUrl(`https://localhost:3001/reset2fa?t=${token.token}`)
      toggleReset2FAModal()
    }
  })

  const [userInfo, setUserInfo] = useState(null)

  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const toggleCreateUserModal = () =>
    setShowCreateUserModal(!showCreateUserModal)

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetPasswordUrl, setResetPasswordUrl] = useState('')
  const toggleResetPasswordModal = () =>
    setShowResetPasswordModal(!showResetPasswordModal)

  const [showReset2FAModal, setShowReset2FAModal] = useState(false)
  const [reset2FAUrl, setReset2FAUrl] = useState('')
  const toggleReset2FAModal = () => setShowReset2FAModal(!showReset2FAModal)

  const [showRoleModal, setShowRoleModal] = useState(false)
  const toggleRoleModal = () => setShowRoleModal(!showRoleModal)

  const [showEnableUserModal, setShowEnableUserModal] = useState(false)
  const toggleEnableUserModal = () =>
    setShowEnableUserModal(!showEnableUserModal)

  const [showInputConfirmModal, setShowInputConfirmModal] = useState(false)
  const toggleInputConfirmModal = () =>
    setShowInputConfirmModal(!showInputConfirmModal)

  const [action, setAction] = useState(null)

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
            toggleRoleModal()
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
                if (u.role === 'superuser') {
                  setAction(() =>
                    createResetPasswordToken.bind(null, {
                      variables: {
                        userID: u.id
                      }
                    })
                  )
                  toggleInputConfirmModal()
                } else {
                  createResetPasswordToken({
                    variables: {
                      userID: u.id
                    }
                  })
                }
              }}
            />
            <Chip
              size="small"
              label="Reset 2FA"
              className={classes.actionChip}
              onClick={() => {
                setUserInfo(u)
                if (u.role === 'superuser') {
                  setAction(() => () =>
                    createReset2FAToken({
                      variables: {
                        userID: u.id
                      }
                    })
                  )
                  toggleInputConfirmModal()
                } else {
                  createReset2FAToken({
                    variables: {
                      userID: u.id
                    }
                  })
                }
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
            toggleEnableUserModal()
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
        <Link color="primary" onClick={toggleCreateUserModal}>
          Add new user
        </Link>
      </Box>
      <DataTable elements={elements} data={R.path(['users'])(userResponse)} />
      <CreateUserModal
        showModal={showCreateUserModal}
        toggleModal={toggleCreateUserModal}
      />
      <ResetPasswordModal
        showModal={showResetPasswordModal}
        toggleModal={toggleResetPasswordModal}
        resetPasswordURL={resetPasswordUrl}
        user={userInfo}
      />
      <Reset2FAModal
        showModal={showReset2FAModal}
        toggleModal={toggleReset2FAModal}
        reset2FAURL={reset2FAUrl}
        user={userInfo}
      />
      <ChangeRoleModal
        showModal={showRoleModal}
        toggleModal={toggleRoleModal}
        user={userInfo}
        confirm={changeUserRole}
        inputConfirmToggle={toggleInputConfirmModal}
        setAction={setAction}
      />
      <EnableUserModal
        showModal={showEnableUserModal}
        toggleModal={toggleEnableUserModal}
        user={userInfo}
        confirm={userInfo?.enabled ? disableUser : enableUser}
        inputConfirmToggle={toggleInputConfirmModal}
        setAction={setAction}
      />
      <Input2FAModal
        showModal={showInputConfirmModal}
        toggleModal={toggleInputConfirmModal}
        action={action}
      />
    </>
  )
}

export default Users
