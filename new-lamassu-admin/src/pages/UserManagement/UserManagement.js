/* eslint-disable prettier/prettier */
import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box, Chip } from '@material-ui/core'
import axios from 'axios'
import gql from 'graphql-tag'
// import moment from 'moment'
import * as R from 'ramda'
import React, { useState, useContext } from 'react'
// import parser from 'ua-parser-js'

import { AppContext } from 'src/App'
import { Link /*, IconButton */ } from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'
// import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'

import styles from './UserManagement.styles'
import ChangeRoleModal from './modals/ChangeRoleModal'
import CreateUserModal from './modals/CreateUserModal'
// import DeleteUserModal from './modals/DeleteUserModal'
import EnableUserModal from './modals/EnableUserModal'
import Input2FAModal from './modals/Input2FAModal'
import Reset2FAModal from './modals/Reset2FAModal'
import ResetPasswordModal from './modals/ResetPasswordModal'

const useStyles = makeStyles(styles)

const url =
  process.env.NODE_ENV === 'development' ? 'https://localhost:8070' : ''

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

/* const DELETE_USERS = gql`
  mutation deleteUser($id: ID!) {
    deleteUser(id: $id) {
      id
    }
  }
` */

const CHANGE_USER_ROLE = gql`
  mutation changeUserRole($id: ID!, $newRole: String!) {
    changeUserRole(id: $id, newRole: $newRole) {
      id
    }
  }
`

const TOGGLE_USER_ENABLE = gql`
  mutation toggleUserEnable($id: ID!) {
    toggleUserEnable(id: $id) {
      id
    }
  }
`

const Users = () => {
  const classes = useStyles()

  const { userData } = useContext(AppContext)

  const { data: userResponse } = useQuery(GET_USERS)

  /* const [deleteUser] = useMutation(DELETE_USERS, {
    refetchQueries: () => ['users']
  }) */

  const [changeUserRole] = useMutation(CHANGE_USER_ROLE, {
    refetchQueries: () => ['users']
  })

  const [toggleUserEnable] = useMutation(TOGGLE_USER_ENABLE, {
    refetchQueries: () => ['users']
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
  const toggleRoleModal = () =>
    setShowRoleModal(!showRoleModal)

  const [showEnableUserModal, setShowEnableUserModal] = useState(false)
  const toggleEnableUserModal = () =>
    setShowEnableUserModal(!showEnableUserModal)

  /* const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const toggleDeleteUserModal = () =>
    setShowDeleteUserModal(!showDeleteUserModal) */

  const [showInputConfirmModal, setShowInputConfirmModal] = useState(false)
  const toggleInputConfirmModal = () =>
    setShowInputConfirmModal(!showInputConfirmModal)
  
  const [action, setAction] = useState(null)

  const requestNewPassword = userID => {
    axios({
      method: 'POST',
      url: `${url}/api/resetpassword`,
      data: {
        userID: userID
      },
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res, err) => {
        if (err) return
        if (res) {
          const status = res.status
          if (status === 200) {
            const token = res.data.token
            setResetPasswordUrl(
              `https://localhost:3001/resetpassword?t=${token.token}`
            )
            toggleResetPasswordModal()
          }
        }
      })
      .catch(err => {
        if (err) console.log('error')
      })
  }

  const requestNew2FA = userID => {
    axios({
      method: 'POST',
      url: `${url}/api/reset2fa`,
      data: {
        userID: userID
      },
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res, err) => {
        if (err) return
        if (res) {
          const status = res.status
          if (status === 200) {
            const token = res.data.token
            setReset2FAUrl(`https://localhost:3001/reset2fa?t=${token.token}`)
            toggleReset2FAModal()
          }
        }
      })
      .catch(err => {
        if (err) console.log('error')
      })
  }

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
                if(u.role === 'superuser') {
                  setAction(() => requestNewPassword.bind(null, u.id))
                  toggleInputConfirmModal()
                } else {
                  requestNewPassword(u.id)
                }
              }}
            />
            <Chip
              size="small"
              label="Reset 2FA"
              className={classes.actionChip}
              onClick={() => {
                setUserInfo(u)
                if(u.role === 'superuser') {
                  setAction(() => requestNew2FA.bind(null, u.id))
                  toggleInputConfirmModal()
                } else {
                  requestNew2FA(u.id)
                }
              }}
            />
          </>
        )
      }
    },
    /* {
      header: 'Actions',
      width: 535,
      textAlign: 'left',
      size: 'sm',
      view: u => {
        const ua = parser(u.last_accessed_from)
        return u.last_accessed_from
          ? `${ua.browser.name} ${ua.browser.version} on ${ua.os.name} ${ua.os.version}`
          : `No Record`
      }
    }, */
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
    }/* ,
    {
      header: 'Delete',
      width: 100,
      textAlign: 'center',
      size: 'sm',
      view: u => (
        <IconButton
          onClick={() => {
            setUserInfo(u)
            toggleDeleteUserModal()
          }}>
          <DeleteIcon />
        </IconButton>
      )
    } */
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
        confirm={toggleUserEnable}
        inputConfirmToggle={toggleInputConfirmModal}
        setAction={setAction}
      />
      {/* <DeleteUserModal
        showModal={showDeleteUserModal}
        toggleModal={toggleDeleteUserModal}
        user={userInfo}
        confirm={deleteUser}
        inputConfirmToggle={toggleInputConfirmModal}
        setAction={setAction}
      /> */}
      <Input2FAModal
        showModal={showInputConfirmModal}
        toggleModal={toggleInputConfirmModal}
        action={action}
      />
    </>
  )
}

export default Users
