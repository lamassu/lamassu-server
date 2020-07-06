import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState, useEffect } from 'react'

import { ActionButton } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { H4, Info3 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import schema from 'src/pages/Services/schemas'
import bitgo from 'src/pages/Services/schemas/singlebitgo'
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
const WalletCoin = () => {
  const classes = useStyles()
  const { data } = useQuery(GET_CONFIG)
  const [saveConfig] = useMutation(SAVE_CONFIG)
  const [saveAccounts] = useMutation(SAVE_ACCOUNTS)
  const [currentCode, setCurrentCode] = useState(null)
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
  const wallets = getItems(accountsConfig, accounts, 'wallet', coinCode)

  useEffect(() => {
    if (currentCode) return
    const wallet =
      walletConfigs && coinCode && fromNamespace(coinCode)(walletConfigs)
    setCurrentCode(wallet && wallet.wallet)
  }, [walletConfigs, coinCode, currentCode])

  const save = wallet => {
    setCurrentCode(wallet)
    const config = toNamespace(`wallets_${coinCode}`)({
      active: true,
      wallet
    })
    return saveConfig({ variables: { config } })
  }

  const saveWallet = name => wallet => {
    const accounts = { [name]: wallet }
    return saveAccounts({ variables: { accounts } })
  }

  return (
    <div className={classes.mdForm}>
      <H4>Choose your wallet</H4>
      <RadioGroup
        labelClassName={classes.radioLabel}
        className={classes.radioGroup}
        options={R.union(wallets.filled, wallets.unfilled)}
        value={currentCode}
        onChange={event => save(event.target.value)}
      />
      {currentCode === 'bitgo' && (
        <>
          <div className={classes.infoMessage}>
            <WarningIcon />
            <Info3>
              Make sure you set up a BitGo wallet to enter the necessary
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
              href="https://support.lamassu.is/hc/en-us/articles/360024455592-Setting-up-BitGo">
              Support article
            </a>
          </ActionButton>
          <H4 noMargin>Enter wallet information</H4>
          <FormRenderer
            value={accounts.bitgo}
            save={saveWallet(currentCode)}
            elements={bitgo(coinCode).elements}
            validationSchema={bitgo(coinCode).validationSchema}
            buttonLabel={'Confirm'}
          />
        </>
      )}
      {currentCode === 'bitcoind' && (
        <div className={classes.infoMessage}>
          <WarningIcon />
          <Info3>
            To setup bitcoind please read our instructions from our support
            article. We’ll later verify if your wallet is correctly set up for
            you to progress
          </Info3>
        </div>
      )}
      {currentCode === 'infura' && (
        <>
          <H4>Enter wallet information</H4>
          <FormRenderer
            value={accounts.infura}
            save={saveWallet(currentCode)}
            elements={schema.infura.elements}
            validationSchema={schema.infura.validationSchema}
            buttonLabel={'Confirm'}
          />
        </>
      )}
    </div>
  )
}

export default WalletCoin
