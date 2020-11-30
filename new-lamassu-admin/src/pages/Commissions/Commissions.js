import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import TitleSection from 'src/components/layout/TitleSection'
import { ReactComponent as ExeceptionViewIcon } from 'src/styling/icons/circle buttons/exception-view/white.svg'
import { ReactComponent as ListingViewIcon } from 'src/styling/icons/circle buttons/listing-view/zodiac.svg'
import { ReactComponent as OverrideLabelIcon } from 'src/styling/icons/status/spring2.svg'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import CommissionsDetails from './components/CommissionsDetails'
import CommissionsList from './components/CommissionsList'
import { removeCoinFromOverride } from './helper.js'

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

const Commissions = ({ name: SCREEN_KEY }) => {
  const [showMachines, setShowMachines] = useState(false)
  const { data } = useQuery(GET_DATA)
  const [saveConfig, { error }] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)
  const localeConfig =
    data?.config && fromNamespace(namespaces.LOCALE)(data.config)

  const currency = R.prop('fiatCurrency')(localeConfig)
  const overrides = R.prop('overrides')(config)

  const save = it => {
    const config = toNamespace(SCREEN_KEY)(it.commissions[0])
    return saveConfig({ variables: { config } })
  }

  const saveOverrides = it => {
    const config = toNamespace(SCREEN_KEY)(it)
    return saveConfig({ variables: { config } })
  }

  const saveOverridesFromList = it => (_, override) => {
    const cryptoOverriden = R.path(['cryptoCurrencies', 0], override)

    const sameMachine = R.eqProps('machine', override)
    const notSameOverride = it => !R.eqProps('cryptoCurrencies', override, it)

    const filterMachine = R.filter(R.both(sameMachine, notSameOverride))
    const removeCoin = removeCoinFromOverride(cryptoOverriden)

    const machineOverrides = R.map(removeCoin)(filterMachine(it))

    const overrides = machineOverrides.concat(
      R.filter(it => !sameMachine(it), it)
    )

    const config = {
      commissions_overrides: R.prepend(override, overrides)
    }

    return saveConfig({ variables: { config } })
  }

  const labels = showMachines
    ? [
        {
          label: 'Override value',
          icon: <OverrideLabelIcon />
        }
      ]
    : []

  return (
    <>
      <TitleSection
        title="Commissions"
        labels={labels}
        button={{
          text: 'List view',
          icon: ListingViewIcon,
          inverseIcon: ExeceptionViewIcon,
          toggle: setShowMachines
        }}
      />

      {!showMachines && (
        <CommissionsDetails
          config={config}
          currency={currency}
          data={data}
          error={error}
          save={save}
          saveOverrides={saveOverrides}
        />
      )}
      {showMachines && (
        <CommissionsList
          config={config}
          localeConfig={localeConfig}
          currency={currency}
          data={data}
          error={error}
          saveOverrides={saveOverridesFromList(overrides)}
        />
      )}
    </>
  )
}

export default Commissions
