import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Button } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { H4 } from 'src/components/typography'

import styles from './Shared.styles'
import { getItems } from './getItems'

const useStyles = makeStyles(styles)

const GET_CONFIG = gql`
  {
    accountsConfig {
      code
      display
      class
      cryptos
    }
  }
`

const ChooseTicker = ({ data: currentData, addData }) => {
  const classes = useStyles()
  const { data } = useQuery(GET_CONFIG)

  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(false)

  const accounts = data?.accounts ?? []
  const accountsConfig = data?.accountsConfig ?? []

  const coin = currentData.coin
  const tickers = getItems(accountsConfig, accounts, 'ticker', coin)

  const submit = () => {
    if (!selected) return setError(true)
    addData({ ticker: selected })
  }

  const onSelect = e => {
    setSelected(e.target.value)
    setError(false)
  }

  return (
    <div className={classes.mdForm}>
      <H4 className={error && classes.error}>Choose your ticker</H4>
      <RadioGroup
        labelClassName={classes.radioLabel}
        className={classes.radioGroup}
        options={R.union(tickers.filled, tickers.unfilled)}
        value={selected}
        onChange={onSelect}
      />
      <Button size="lg" onClick={submit} className={classes.button}>
        Continue
      </Button>
    </div>
  )
}

export default ChooseTicker
