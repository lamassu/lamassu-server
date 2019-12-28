import React, { useState } from 'react'
import * as R from 'ramda'
import { gql } from 'apollo-boost'
import { makeStyles, Modal } from '@material-ui/core'
import { useQuery, useMutation } from '@apollo/react-hooks'

import Title from 'src/components/Title'

import { BitgoCard, BitgoForm } from './Bitgo'
import { BitstampCard, BitstampForm } from './Bitstamp'
import { BlockcypherCard, BlockcypherForm } from './Blockcypher'
import { InfuraCard, InfuraForm } from './Infura'
import { ItbitCard, ItbitForm } from './Itbit'
import { KrakenCard, KrakenForm } from './Kraken'
import { MailgunCard, MailgunForm } from './Mailgun'
import { StrikeCard, StrikeForm } from './Strike'
import { TwilioCard, TwilioForm } from './Twilio'
import { servicesStyles as styles } from './Services.styles'

const useStyles = makeStyles(styles)

const GET_CONFIG = gql`
  {
    config
  }
`

const GET_ACCOUNTS = gql`
  {
    accounts {
      code
      display
      class
      cryptos
    }
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const Services = () => {
  const [open, setOpen] = useState(false)
  const [modalContent, setModalContent] = useState(null)
  const [accountsConfig, setAccountsConfig] = useState(null)
  const [saveConfig, { loading }] = useMutation(SAVE_CONFIG, {
    onCompleted: data => setAccountsConfig(data.saveConfig.accounts)
  })

  const classes = useStyles()

  useQuery(GET_CONFIG, {
    onCompleted: data => setAccountsConfig(data.config.accounts ?? {})
  })
  const { data: accountsResponse } = useQuery(GET_ACCOUNTS)

  const accounts = accountsResponse?.accounts

  const save = (code, it) => {
    const newAccounts = R.clone(accountsConfig)
    newAccounts[code] = it
    return saveConfig({ variables: { config: { accounts: newAccounts } } })
  }

  const getAccount = code => {
    return R.mergeDeepLeft(
      R.find(R.propEq('code', code))(accounts) ?? {},
      accountsConfig[code] ?? {}
    )
  }

  const handleOpen = content => {
    setOpen(true)
    setModalContent(content)
  }

  const handleClose = (canClose = true) => {
    if (canClose && !loading) {
      setOpen(false)
      setModalContent(null)
    }
  }

  if (!accounts || !accountsConfig) return null

  const codes = {
    bitgo: 'bitgo',
    bitstamp: 'bitstamp',
    blockcypher: 'blockcypher',
    infura: 'infura',
    itbit: 'itbit',
    kraken: 'kraken',
    mailgun: 'mailgun',
    strike: 'strike',
    twilio: 'twilio'
  }

  const bitgo = getAccount(codes.bitgo)
  const bitstamp = getAccount(codes.bitstamp)
  const blockcypher = getAccount(codes.blockcypher)
  const infura = getAccount(codes.infura)
  const itbit = getAccount(codes.itbit)
  const kraken = getAccount(codes.kraken)
  const mailgun = getAccount(codes.mailgun)
  const strike = getAccount(codes.strike)
  const twilio = getAccount(codes.twilio)

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleContainer}>
          <Title>3rd Party Services</Title>
        </div>
      </div>
      <div className={classes.mainWrapper}>
        <BitgoCard
          account={bitgo}
          onEdit={() =>
            handleOpen(
              <BitgoForm
                account={bitgo}
                handleClose={handleClose}
                save={save}
              />
            )
          }
        />
        <BitstampCard
          account={bitstamp}
          onEdit={() =>
            handleOpen(
              <BitstampForm
                account={bitstamp}
                handleClose={handleClose}
                save={save}
              />
            )
          }
        />
        <BlockcypherCard
          account={blockcypher}
          onEdit={() =>
            handleOpen(
              <BlockcypherForm
                account={blockcypher}
                handleClose={handleClose}
                save={save}
              />
            )
          }
        />
        <InfuraCard
          account={infura}
          onEdit={() =>
            handleOpen(
              <InfuraForm
                account={infura}
                handleClose={handleClose}
                save={save}
              />
            )
          }
        />
        <ItbitCard
          account={itbit}
          onEdit={() =>
            handleOpen(
              <ItbitForm
                account={itbit}
                handleClose={handleClose}
                save={save}
              />
            )
          }
        />
        <KrakenCard
          account={kraken}
          onEdit={() =>
            handleOpen(
              <KrakenForm
                account={kraken}
                handleClose={handleClose}
                save={save}
              />
            )
          }
        />
        <MailgunCard
          account={mailgun}
          onEdit={() =>
            handleOpen(
              <MailgunForm
                account={mailgun}
                handleClose={handleClose}
                save={save}
              />
            )
          }
        />
        <StrikeCard
          account={strike}
          onEdit={() =>
            handleOpen(
              <StrikeForm
                account={strike}
                handleClose={handleClose}
                save={save}
              />
            )
          }
        />
        <TwilioCard
          account={twilio}
          onEdit={() =>
            handleOpen(
              <TwilioForm
                account={twilio}
                handleClose={handleClose}
                save={save}
              />
            )
          }
        />
      </div>
      {modalContent && (
        <Modal
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
          open={open}
          onClose={handleClose}
          className={classes.modal}>
          <div>{modalContent}</div>
        </Modal>
      )}
    </>
  )
}

export default Services
