import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useEffect, useState } from 'react'

import { NamespacedTable as EditableTable } from 'src/components/editableTable'
import { P, H4 } from 'src/components/typography'
import { getElements } from 'src/pages/Wallet/helper'
import { fromNamespace } from 'src/utils/config'

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

const Wallet = ({ dispatch, namespace }) => {
  const { data } = useQuery(GET_INFO)
  const [dispatched, setDispatched] = useState(false)

  const config = data?.config && fromNamespace('wallets')(data.config)

  const wizardCoin =
    config && Object.keys(config).find(k => k.endsWith('_wizard') && config[k])
  const coinCode = wizardCoin && wizardCoin.replace('_wizard', '')

  const accountsConfig = data?.accountsConfig
  const cryptoCurrencies =
    data?.cryptoCurrencies?.filter(({ code }) => code === coinCode) ?? []

  useEffect(() => {
    if (dispatched || !data?.config) return

    dispatch({
      type: 'wizard/VALIDATE_STEP',
      payload: { config: data.config, accounts: data.accounts }
    })
    setDispatched(true)
  }, [data, dispatch, dispatched])

  return (
    <>
      <H4>All set</H4>
      <P>
        This are your wallet settings. You can later edit these and add
        additional coins.
      </P>
      <EditableTable
        rowSize="lg"
        titleLg
        name="All set"
        namespaces={R.map(R.path(['code']))(cryptoCurrencies)}
        data={config}
        elements={getElements(cryptoCurrencies, accountsConfig, true)}
      />
    </>
  )
}

export default Wallet
