import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Button, ActionButton } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { H4, Info3 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import schema from 'src/pages/Services/schemas'
import bitgo from 'src/pages/Services/schemas/singlebitgo'
import { ReactComponent as InverseLinkIcon } from 'src/styling/icons/action/external link/white.svg'
import { ReactComponent as LinkIcon } from 'src/styling/icons/action/external link/zodiac.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'

import styles from './Shared.styles'
import { getItems } from './getItems'

const useStyles = makeStyles(styles)

const GET_CONFIG = gql`
  {
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

const SAVE_ACCOUNTS = gql`
  mutation Save($accounts: JSONObject) {
    saveAccounts(accounts: $accounts)
  }
`

const isConfigurable = it => R.contains(it)(['infura', 'bitgo'])

const isLocalHosted = it =>
  R.contains(it)([
    'bitcoind',
    'geth',
    'litecoind',
    'dashd',
    'zcashd',
    'bitcoincashd'
  ])

const ChooseWallet = ({ data: currentData, addData }) => {
  const classes = useStyles()
  const { data } = useQuery(GET_CONFIG)
  const [saveAccounts] = useMutation(SAVE_ACCOUNTS, {
    onCompleted: () => submit()
  })

  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(false)

  const accounts = data?.accounts ?? []
  const accountsConfig = data?.accountsConfig ?? []

  const coin = currentData.coin
  const wallets = getItems(accountsConfig, accounts, 'wallet', coin)

  const saveWallet = name => wallet => {
    const accounts = { [name]: wallet }
    return saveAccounts({ variables: { accounts } })
  }

  const submit = () => {
    if (!selected) return setError(true)
    addData({ wallet: selected })
  }

  const onSelect = e => {
    setSelected(e.target.value)
    setError(false)
  }

  return (
    <div className={classes.mdForm}>
      <H4 className={error && classes.error}>Choose your wallet</H4>
      <RadioGroup
        labelClassName={classes.radioLabel}
        className={classes.radioGroup}
        options={R.union(wallets.filled, wallets.unfilled)}
        value={selected}
        onChange={onSelect}
      />
      {isLocalHosted(selected) && (
        <div className={classes.infoMessage}>
          <WarningIcon />
          <Info3>
            To setup {selected} please read our instructions from our support
            article.
          </Info3>
        </div>
      )}
      {!isConfigurable(selected) && (
        <Button size="lg" onClick={submit} className={classes.button}>
          Continue
        </Button>
      )}
      {selected === 'bitgo' && (
        <>
          <div className={classes.infoMessage}>
            <WarningIcon />
            <Info3>
              Make sure you set up a BitGo wallet to enter the necessary
              information below. Please follow the instructions on our support
              page if you haven’t.
            </Info3>
          </div>
          <a
            className={classes.actionButtonLink}
            target="_blank"
            rel="noopener noreferrer"
            href="https://support.lamassu.is/hc/en-us/articles/360024455592-Setting-up-BitGo">
            <ActionButton
              className={classes.actionButton}
              color="primary"
              Icon={LinkIcon}
              InverseIcon={InverseLinkIcon}>
              Support article
            </ActionButton>
          </a>
          <H4 noMargin>Enter wallet information</H4>
          <FormRenderer
            value={accounts.bitgo}
            save={saveWallet(selected)}
            elements={bitgo(coin).elements}
            validationSchema={bitgo(coin).validationSchema}
            buttonLabel={'Continue'}
            buttonClass={classes.formButton}
          />
        </>
      )}
      {selected === 'infura' && (
        <>
          <H4 noMargin>Enter wallet information</H4>
          <FormRenderer
            value={accounts.infura}
            save={saveWallet(selected)}
            elements={schema.infura.elements}
            validationSchema={schema.infura.validationSchema}
            buttonLabel={'Continue'}
            buttonClass={classes.formButton}
          />
        </>
      )}
    </div>
  )
}

export default ChooseWallet
