import { useLazyQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { CodeInput } from 'src/components/inputs/base'
import { Info2, P } from 'src/components/typography'

import styles from '../UserManagement.styles'

const useStyles = makeStyles(styles)

const CONFIRM_2FA = gql`
  query confirm2FA($code: String!) {
    confirm2FA(code: $code)
  }
`

const Input2FAModal = ({ showModal, toggleModal, action, vars }) => {
  const classes = useStyles()

  const [twoFACode, setTwoFACode] = useState('')
  const [invalidCode, setInvalidCode] = useState(false)

  const handleCodeChange = value => {
    setTwoFACode(value)
    setInvalidCode(false)
  }

  const handleClose = () => {
    setTwoFACode('')
    setInvalidCode(false)
    toggleModal()
  }

  const [confirm2FA, { error: queryError }] = useLazyQuery(CONFIRM_2FA, {
    onCompleted: ({ confirm2FA: success }) => {
      if (!success) {
        setInvalidCode(true)
      } else {
        action()
        handleClose()
      }
    }
  })

  const getErrorMsg = () => {
    if (queryError) return 'Internal server error'
    if (twoFACode.length !== 6 && invalidCode)
      return 'The code should have 6 characters!'
    if (invalidCode) return 'Code is invalid. Please try again.'
    return null
  }

  return (
    <>
      {showModal && (
        <Modal
          closeOnBackdropClick={true}
          width={500}
          height={350}
          handleClose={handleClose}
          open={true}>
          <Info2 className={classes.modalTitle}>Confirm action</Info2>
          <P className={classes.info}>
            To make changes on this user, please confirm this action by entering
            your two-factor authentication code below.
          </P>
          <CodeInput
            name="2fa"
            value={twoFACode}
            onChange={handleCodeChange}
            numInputs={6}
            error={invalidCode}
            containerStyle={classes.codeContainer}
            shouldAutoFocus
          />
          {getErrorMsg() && (
            <P className={classes.errorMessage}>{getErrorMsg()}</P>
          )}
          <div className={classes.footer}>
            <Button
              className={classes.submit}
              onClick={() => {
                if (twoFACode.length !== 6) {
                  setInvalidCode(true)
                  return
                }
                confirm2FA({ variables: { code: twoFACode } })
              }}>
              Confirm
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default Input2FAModal
