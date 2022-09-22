import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as uuid from 'uuid'

import { Button, SupportLinkButton } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { H4, Info3 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import _schemas from 'src/pages/Services/schemas'
import bitgo from 'src/pages/Services/schemas/singlebitgo'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import { getAccountInstance } from 'src/utils/accounts'

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

const isConfigurable = it => R.contains(it)(['infura', 'bitgo', 'coinbasepro'])

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

  const schemas = _schemas({})
  const saveWallet = name => newAccount => {
    const accountObj = R.pick(
      ['category', 'code', 'elements', 'name'],
      schemas[name]
    )

    const accountInstances = R.isNil(accounts[name])
      ? []
      : R.clone(accounts[name].instances)

    accountInstances.push(R.merge(newAccount, { id: uuid.v4(), enabled: true }))

    return saveAccounts({
      variables: {
        accounts: {
          [name]: {
            ...accountObj,
            instances: accountInstances
          }
        }
      }
    })
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
        <>
          <div className={classes.infoMessage}>
            <WarningIcon />
            <Info3>
              To set up {selected} please read the node wallet instructions from
              our support portal.
            </Info3>
          </div>
          <SupportLinkButton
            link="https://support.lamassu.is/hc/en-us/articles/115001209552-Setting-up-your-node-wallets"
            label="Support article"
          />
        </>
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
          <SupportLinkButton
            link="https://support.lamassu.is/hc/en-us/articles/360024455592-Setting-up-BitGo"
            label="Support article"
          />
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
            value={getAccountInstance(accounts.infura)}
            save={saveWallet(selected)}
            elements={schemas.infura.elements}
            validationSchema={schemas.infura.getValidationSchema(
              getAccountInstance(accounts.infura)
            )}
            buttonLabel={'Continue'}
            buttonClass={classes.formButton}
          />
        </>
      )}
      {selected === 'coinbasepro' && (
        <>
          <H4 noMargin>Enter wallet information</H4>
          <FormRenderer
            value={accounts.coinbasepro}
            save={saveWallet(selected)}
            elements={schemas.coinbasepro.elements}
            validationSchema={schemas.coinbasepro.getValidationSchema(
              accounts.coinbasepro
            )}
            buttonLabel={'Continue'}
            buttonClass={classes.formButton}
          />
        </>
      )}
    </div>
  )
}

export default ChooseWallet
