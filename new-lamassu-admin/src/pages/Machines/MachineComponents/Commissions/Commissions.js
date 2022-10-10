import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import { overrides } from './helper'

const GET_DATA = gql`
  query getData {
    config
    cryptoCurrencies {
      code
      display
    }
    machines {
      name
      deviceId
    }
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const Commissions = ({ name: SCREEN_KEY, id: deviceId }) => {
  const { data, loading } = useQuery(GET_DATA)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)
  const currency = R.path(['fiatCurrency'])(
    fromNamespace(namespaces.LOCALE)(data?.config)
  )

  const saveOverrides = it => {
    const config = toNamespace(SCREEN_KEY)(it)
    return saveConfig({ variables: { config } })
  }

  const getMachineCommissions = () => {
    if (loading || !deviceId || !config) return []

    const overrides = config.overrides
      ? R.concat(
          R.filter(R.propEq('machine', 'ALL_MACHINES'), config.overrides),
          R.filter(R.propEq('machine', deviceId), config.overrides)
        )
      : []

    return R.map(
      coin =>
        R.reduce(
          R.mergeDeepRight,
          {
            code: coin.code,
            name: coin.display,
            cashIn: config.cashIn,
            cashOut: config.cashOut,
            fixedFee: config.fixedFee,
            minimumTx: config.minimumTx,
            cashOutFixedFee: config.cashOutFixedFee
          },
          R.project(
            ['cashIn', 'cashOut', 'fixedFee', 'minimumTx', 'cashOutFixedFee'],
            R.filter(
              o =>
                R.includes(coin.code, o.cryptoCurrencies) ||
                R.includes('ALL_COINS', o.cryptoCurrencies),
              overrides
            )
          )
        ),
      data.cryptoCurrencies
    )
  }

  return (
    <EditableTable
      name="overrides"
      save={saveOverrides}
      data={getMachineCommissions()}
      elements={overrides(currency)}
    />
  )
}

export default Commissions
