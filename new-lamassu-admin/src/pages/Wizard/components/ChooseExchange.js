import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState, useEffect, useCallback } from 'react'

import { ActionButton } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { H4, Info3 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import schema from 'src/pages/Services/schemas'
import styles from 'src/pages/Wizard/Radio.styles'
import { ReactComponent as InverseLinkIcon } from 'src/styling/icons/action/external link/white.svg'
import { ReactComponent as LinkIcon } from 'src/styling/icons/action/external link/zodiac.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import { getItems } from './getItems'

const useStyles = makeStyles(styles)

const GET_CONFIG = gql`
  {
    config
    accounts
    accountsConfig {
      code
      display
      class
      cryptos
    }
    cryptoCurrencies {
      code
      display
    }
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`
const SAVE_ACCOUNTS = gql`
  mutation Save($accounts: JSONObject) {
    saveAccounts(accounts: $accounts)
  }
`
const ChooseExchange = () => {
  const classes = useStyles()
  const { data } = useQuery(GET_CONFIG)
  const [saveConfig] = useMutation(SAVE_CONFIG)
  const [saveAccounts] = useMutation(SAVE_ACCOUNTS)
  const [currentCode, setCurrentCode] = useState(null)
  const [currentName, setCurrentName] = useState(null)
  const accounts = data?.accounts ?? []
  const accountsConfig = data?.accountsConfig ?? []

  const walletConfigs =
    data?.config && fromNamespace(namespaces.WALLETS)(data.config)
  const wizardCoin =
    walletConfigs &&
    Object.keys(walletConfigs).find(
      k => k.endsWith('_wizard') && walletConfigs[k]
    )

  const coinCode = wizardCoin && wizardCoin.replace('_wizard', '')
  const exchanges = getItems(accountsConfig, accounts, 'exchange', coinCode)

  const setCurrName = useCallback(
    currentCode => {
      const ex =
        currentCode &&
        R.union(exchanges.filled, exchanges.unfilled).find(
          ({ code }) => code === currentCode
        )
      setCurrentName(ex && ex.display)
    },
    [exchanges]
  )

  useEffect(() => {
    if (currentCode) return
    const exchange =
      walletConfigs && coinCode && fromNamespace(coinCode)(walletConfigs)
    setCurrentCode(exchange && exchange.exchange)
    setCurrName(exchange && exchange.exchange)
  }, [walletConfigs, coinCode, currentCode, setCurrName])

  const save = exchange => {
    setCurrentCode(exchange)
    setCurrName(exchange)
    const config = toNamespace(`wallets_${coinCode}`)({
      active: true,
      exchange
    })
    return saveConfig({ variables: { config } })
  }

  const saveExchange = name => exchange => {
    const accounts = { [name]: exchange }
    return saveAccounts({ variables: { accounts } })
  }

  const supportArticles = {
    kraken:
      'https://support.lamassu.is/hc/en-us/articles/115001206891-Kraken-trading',
    itbit:
      'https://support.lamassu.is/hc/en-us/articles/360026195032-itBit-trading',
    bitstamp:
      'https://support.lamassu.is/hc/en-us/articles/115001206911-Bitstamp-trading'
  }

  return (
    <div className={classes.mdForm}>
      <H4>Choose your exchange</H4>
      <RadioGroup
        labelClassName={classes.radioLabel}
        className={classes.radioGroup}
        options={R.union(exchanges.filled, exchanges.unfilled)}
        value={currentCode}
        onChange={event => save(event.target.value)}
      />
      {['kraken', 'itbit', 'bitstamp'].includes(currentCode) && (
        <>
          <div className={classes.infoMessage}>
            <WarningIcon />
            <Info3>
              Make sure you set up {currentName} to enter the necessary
              information below. Please follow the instructions on our support
              page if you haven’t.
            </Info3>
          </div>
          <ActionButton
            className={classes.actionButton}
            color="primary"
            Icon={LinkIcon}
            InverseIcon={InverseLinkIcon}>
            <a
              className={classes.actionButtonLink}
              target="_blank"
              rel="noopener noreferrer"
              href={supportArticles[currentCode]}>
              {currentName} trading
            </a>
          </ActionButton>

          <H4 noMargin>Enter exchange information</H4>
          <FormRenderer
            value={accounts[currentCode]}
            save={saveExchange(currentCode)}
            elements={schema[currentCode].elements}
            validationSchema={schema[currentCode].validationSchema}
            buttonLabel={'Confirm'}
          />
        </>
      )}
    </div>
  )
}

export default ChooseExchange
