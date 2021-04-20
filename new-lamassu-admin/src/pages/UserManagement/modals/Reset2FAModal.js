import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import React, { useEffect, useState } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import { Info2, P, Mono } from 'src/components/typography'
import CopyToClipboard from 'src/pages/Transactions/CopyToClipboard'
import { urlResolver } from 'src/utils/urlResolver'

import styles from '../UserManagement.styles'

import Input2FAModal from './Input2FAModal'

const CREATE_RESET_2FA_TOKEN = gql`
  mutation createReset2FAToken($confirmationCode: String, $userID: ID!) {
    createReset2FAToken(confirmationCode: $confirmationCode, userID: $userID) {
      token
      user_id
      expire
    }
  }
`

const useStyles = makeStyles(styles)

const Reset2FAModal = ({ state, dispatch, user, requiresConfirmation }) => {
  const classes = useStyles()
  const [reset2FAUrl, setReset2FAUrl] = useState('')

  const [createReset2FAToken, { loading, error }] = useMutation(
    CREATE_RESET_2FA_TOKEN,
    {
      onCompleted: ({ createReset2FAToken: token }) => {
        setReset2FAUrl(urlResolver(`/reset2fa?t=${token.token}`))
      }
    }
  )

  const [confirmation, setConfirmation] = useState(null)

  useEffect(() => {
    state.showReset2FAModal &&
      (confirmation || !requiresConfirmation) &&
      createReset2FAToken({
        variables: {
          confirmationCode: confirmation,
          userID: user?.id
        }
      })
  }, [
    confirmation,
    createReset2FAToken,
    requiresConfirmation,
    state.showReset2FAModal,
    user?.id
  ])

  const handleClose = () => {
    setConfirmation(null)
    dispatch({
      type: 'close',
      payload: 'showReset2FAModal'
    })
  }

  return (
    (state.showReset2FAModal && requiresConfirmation && !confirmation && (
      <Input2FAModal
        showModal={state.showReset2FAModal}
        handleClose={handleClose}
        setConfirmation={setConfirmation}
      />
    )) ||
    (state.showReset2FAModal &&
      (confirmation || !requiresConfirmation) &&
      !loading && (
        <Modal
          closeOnBackdropClick={true}
          width={500}
          height={200}
          handleClose={handleClose}
          open={true}>
          <Info2 className={classes.modalTitle}>
            Reset 2FA for {user.username}
          </Info2>
          <P className={classes.info}>
            Safely share this link with {user.username} for a two-factor
            authentication reset.
          </P>
          {!error && (
            <div className={classes.addressWrapper}>
              <Mono className={classes.address}>
                <strong>
                  <CopyToClipboard
                    className={classes.link}
                    buttonClassname={classes.copyToClipboard}
                    wrapperClassname={classes.linkWrapper}>
                    {reset2FAUrl}
                  </CopyToClipboard>
                </strong>
              </Mono>
            </div>
          )}
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Modal>
      ))
  )
}

export default Reset2FAModal
