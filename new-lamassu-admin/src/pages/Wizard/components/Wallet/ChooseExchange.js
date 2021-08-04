import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Button, SupportLinkButton } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { H4, Info3 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import schema from 'src/pages/Services/schemas'
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

const isConfigurable = it =>
  R.contains(it)(['kraken', 'itbit', 'bitstamp', 'binanceus', 'cex', 'ftx'])

const ChooseExchange = ({ data: currentData, addData }) => {
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
  const exchanges = getItems(accountsConfig, accounts, 'exchange', coin)

  const submit = () => {
    if (!selected) return setError(true)
    addData({ exchange: selected })
  }

  const saveExchange = name => exchange => {
    const accounts = { [name]: exchange }
    return saveAccounts({ variables: { accounts } })
  }

  const onSelect = e => {
    setSelected(e.target.value)
    setError(false)
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
      <H4 className={error && classes.error}>Choose your exchange</H4>
      <RadioGroup
        labelClassName={classes.radioLabel}
        className={classes.radioGroup}
        options={R.union(exchanges.filled, exchanges.unfilled)}
        value={selected}
        onChange={onSelect}
      />
      {!isConfigurable(selected) && (
        <Button size="lg" onClick={submit} className={classes.button}>
          Continue
        </Button>
      )}
      {isConfigurable(selected) && (
        <>
          <div className={classes.infoMessage}>
            <WarningIcon />
            <Info3>
              Make sure you set up {schema[selected].name} to enter the
              necessary information below. Please follow the instructions on our
              support page if you haven’t.
            </Info3>
          </div>
          <SupportLinkButton
            link={supportArticles[selected]}
            label={`${schema[selected].name} trading`}
          />

          <H4 noMargin>Enter exchange information</H4>
          <FormRenderer
            value={accounts[selected]}
            save={saveExchange(selected)}
            elements={schema[selected].elements}
            validationSchema={schema[selected].validationSchema}
            buttonLabel={'Continue'}
            buttonClass={classes.formButton}
          />
        </>
      )}
    </div>
  )
}

export default ChooseExchange
