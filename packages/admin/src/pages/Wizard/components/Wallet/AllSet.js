import { useQuery, useMutation } from '@apollo/react-hooks'
import { utils as coinUtils } from '@lamassu/coins'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Button } from 'src/components/buttons'
import { NamespacedTable as EditableTable } from 'src/components/editableTable'
import { P, H4 } from 'src/components/typography'
import { getElements, WalletSchema } from 'src/pages/Wallet/helper'
import { toNamespace, namespaces } from 'src/utils/config'

import styles from './Shared.styles'

const useStyles = makeStyles(styles)
const GET_INFO = gql`
  query getData {
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
  mutation Save($config: JSONObject, $accounts: JSONObject) {
    saveConfig(config: $config)
    saveAccounts(accounts: $accounts)
  }
`

const AllSet = ({ data: currentData, doContinue }) => {
  const classes = useStyles()

  const { data } = useQuery(GET_INFO)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: doContinue
  })

  const [error, setError] = useState(false)

  const coin = currentData?.coin

  const accountsConfig = data?.accountsConfig
  const cryptoCurrencies = data?.cryptoCurrencies ?? []

  const save = () => {
    const defaultCryptoUnit = R.head(
      R.keys(coinUtils.getCryptoCurrency(coin).units)
    )
    const adjustedData = {
      zeroConfLimit: 0,
      ...currentData,
      cryptoUnits: defaultCryptoUnit
    }
    if (!WalletSchema.isValidSync(adjustedData)) return setError(true)

    const withCoin = toNamespace(coin, R.omit('coin', adjustedData))
    const config = toNamespace(namespaces.WALLETS)(withCoin)
    setError(false)
    return saveConfig({ variables: { config } })
  }

  const presentableData = R.pipe(
    R.omit(['coin', 'zeroConf', 'zeroConfLimit']),
    toNamespace(coin)
  )(currentData)

  const presentableElements = R.filter(
    R.pipe(
      R.prop('name'),
      R.flip(R.includes)(['zeroConf', 'zeroConfLimit']),
      R.not()
    ),
    getElements(cryptoCurrencies, accountsConfig, null, true)
  )

  return (
    <>
      <H4 className={error && classes.error}>All set</H4>
      <P>
        These are your wallet settings. You can later edit these and add
        additional coins.
      </P>
      <EditableTable
        rowSize="lg"
        titleLg
        name="All set"
        namespaces={[coin]}
        data={presentableData}
        elements={presentableElements}
      />
      <Button size="lg" onClick={save} className={classes.button}>
        Continue
      </Button>
    </>
  )
}

export default AllSet
