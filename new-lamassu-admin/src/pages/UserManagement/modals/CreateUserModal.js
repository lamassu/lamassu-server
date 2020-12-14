import { makeStyles } from '@material-ui/core/styles'
import axios from 'axios'
import React, { useState } from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { TextInput } from 'src/components/inputs/base'
import { H1, H2, H3, Info3, Mono } from 'src/components/typography'
import CopyToClipboard from 'src/pages/Transactions/CopyToClipboard'

import styles from '../UserManagement.styles'

const url =
  process.env.NODE_ENV === 'development' ? 'https://localhost:8070' : ''

const useStyles = makeStyles(styles)

const schema = Yup.object().shape({
  email: Yup.string()
    .email()
    .required()
})

const CreateUserModal = ({ showModal, toggleModal }) => {
  const classes = useStyles()

  const [usernameField, setUsernameField] = useState('')
  const [roleField, setRoleField] = useState('')
  const [createUserURL, setCreateUserURL] = useState(null)
  const [invalidUser, setInvalidUser] = useState(false)

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

  const handleUsernameChange = event => {
    if (event.target.value === '') {
      setInvalidUser(false)
    }
    setUsernameField(event.target.value)
  }

  const handleRoleChange = event => {
    setRoleField(event.target.value)
  }

  const handleClose = () => {
    setUsernameField('')
    setRoleField('')
    setInvalidUser(false)
    setCreateUserURL(null)
    toggleModal()
  }

  const validateNewUser = () => {
    const username = usernameField.trim()

    schema
      .isValid({ email: username })
      .then(valid => {
        if (!valid) {
          setInvalidUser(true)
          return
        }
        handleCreateUser()
      })
      .catch(err => {
        console.log(err)
        setInvalidUser(true)
      })
  }

  const handleCreateUser = () => {
    const username = usernameField.trim()

    axios({
      method: 'POST',
      url: `${url}/api/createuser`,
      data: {
        username: username,
        role: roleField
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
          const message = res.data.message
          if (status === 200 && message) setInvalidUser(true)
          if (status === 200 && !message) {
            const token = res.data.token
            setCreateUserURL(`https://localhost:3001/register?t=${token.token}`)
          }
        }
      })
      .catch(err => {
        if (err) console.log('error')
      })
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
          <H1 className={classes.modalTitle}>Create new user</H1>
          <H3 className={classes.modalLabel1}>User login</H3>
          <TextInput
            error={invalidUser}
            name="username"
            autoFocus
            id="username"
            type="text"
            size="lg"
            width={338}
            onChange={handleUsernameChange}
            value={usernameField}
          />
          <H3 className={classes.modalLabel2}>Role</H3>
          <RadioGroup
            name="userrole"
            value={roleField}
            options={radioOptions}
            onChange={handleRoleChange}
            className={classes.radioGroup}
            labelClassName={classes.radioLabel}
          />
          <div className={classes.footer}>
            <Button onClick={validateNewUser}>Finish</Button>
          </div>
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
