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
    if (loading || !deviceId || !config) {
      return []
    }
    const commissions = {}

    // first, get general non overridden commissions
    const makeInfo = x =>
      (commissions[R.prop('code')(x)] = {
        code: x.code,
        name: x.display,
        cashIn: config.cashIn,
        cashOut: config.cashOut,
        fixedFee: config.fixedFee,
        minimumTx: config.minimumTx
      })
    R.forEach(makeInfo)(data.cryptoCurrencies)

    // second, get overrides for all machines
    const isId = id => R.propEq('machine', id)
    const generalOverrides = config.overrides
      ? R.filter(isId('ALL_MACHINES'))(config.overrides)
      : []

    const overrideInfo = o => {
      commissions[o.cryptoCurrencies[0]].cashIn = o.cashIn
      commissions[o.cryptoCurrencies[0]].cashOut = o.cashOut
      commissions[o.cryptoCurrencies[0]].fixedFee = o.fixedFee
      commissions[o.cryptoCurrencies[0]].minimumTx = o.minimumTx
    }
    R.forEach(overrideInfo)(generalOverrides)

    // third, get overrides for this machine
    const machineOverrides = config.overrides
      ? R.filter(isId(deviceId))(config.overrides)
      : []
    R.forEach(overrideInfo)(machineOverrides)

    // in the end, the machine specific overrides overwrite the less general ALL_MACHINE overrides or the general overrides
    return R.values(commissions)
  }

  const machineCommissions = getMachineCommissions()

  return (
    <EditableTable
      name="overrides"
      save={saveOverrides}
      data={machineCommissions}
      elements={overrides(currency)}
    />
  )
}

export default Commissions
