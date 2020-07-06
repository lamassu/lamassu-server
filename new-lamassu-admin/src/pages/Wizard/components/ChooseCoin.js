import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import React, { useState, useEffect } from 'react'

import { RadioGroup } from 'src/components/inputs'
import { H4 } from 'src/components/typography'
import styles from 'src/pages/Wizard/Radio.styles'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

const useStyles = makeStyles(styles)

const GET_CONFIG = gql`
  {
    config
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

const WalletCoin = () => {
  const classes = useStyles()

  const { data } = useQuery(GET_CONFIG)
  const [saveConfig] = useMutation(SAVE_CONFIG)
  const [currentCode, setCurrentCode] = useState(null)
  const cryptoCurrencies = data?.cryptoCurrencies ?? []

  const wallets = data?.config && fromNamespace('wallets')(data.config)
  const wizardCoin =
    wallets &&
    Object.keys(wallets).find(k => k.endsWith('_wizard') && wallets[k])

  useEffect(() => {
    setCurrentCode(wizardCoin && wizardCoin.replace('_wizard', ''))
  }, [wizardCoin])

  const save = code => {
    setCurrentCode(code)

    const keys = {}
    for (const { code: c } of cryptoCurrencies) {
      keys[`${c}_wizard`] = c === code
    }

    keys[`${code}_zeroConf`] = 'no-zero-conf'
    keys[`${code}_ticker`] = 'kraken'

    const config = toNamespace(namespaces.WALLETS)(keys)
    return saveConfig({ variables: { config } })
  }

  return (
    <>
      <H4>Choose your first cryptocurrency</H4>

      <RadioGroup
        labelClassName={classes.radioLabel}
        className={classes.radioGroup}
        options={cryptoCurrencies}
        value={currentCode}
        onChange={event => save(event.target.value)}
      />
    </>
  )
}

export default WalletCoin
