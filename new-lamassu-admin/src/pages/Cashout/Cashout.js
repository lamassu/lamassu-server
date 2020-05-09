import { useQuery, useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import * as R from 'ramda'
import React, { useState } from 'react'

import { NamespacedTable as EditableTable } from 'src/components/editableTable'
import TitleSection from 'src/components/layout/TitleSection'
import { fromNamespace, toNamespace } from 'src/utils/config'

import Wizard from './Wizard'
import { DenominationsSchema, getElements } from './helper'

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject, $accounts: [JSONObject]) {
    saveConfig(config: $config)
    saveAccounts(accounts: $accounts)
  }
`

const GET_INFO = gql`
  query getData {
    machines {
      name
      deviceId
      cashbox
      cassette1
      cassette2
    }
    config
  }
`

const CashOut = ({ name: SCREEN_KEY }) => {
  const [wizard, setWizard] = useState(false)
  const [error, setError] = useState(false)
  const { data } = useQuery(GET_INFO)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setWizard(false),
    onError: () => setError(true),
    refetchQueries: () => ['getData']
  })

  const save = (rawConfig, accounts) => {
    const config = toNamespace(SCREEN_KEY)(rawConfig)
    setError(false)

    return saveConfig({ variables: { config, accounts } })
  }

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)
  const locale = data?.config && fromNamespace('locale')(data.config)
  const machines = data?.machines ?? []

  const onToggle = id => {
    const namespaced = fromNamespace(id)(config)
    if (!DenominationsSchema.isValidSync(namespaced)) return setWizard(id)
    save(toNamespace(id, { active: !namespaced?.active }))
  }

  return (
    <>
      <TitleSection title="Cash-out" error={error} />
      <EditableTable
        name="test"
        namespaces={R.map(R.path(['deviceId']))(machines)}
        data={config}
        stripeWhen={it => !DenominationsSchema.isValidSync(it)}
        enableEdit
        editWidth={134}
        enableToggle
        toggleWidth={109}
        onToggle={onToggle}
        save={save}
        validationSchema={DenominationsSchema}
        disableRowEdit={R.compose(R.not, R.path(['active']))}
        elements={getElements(machines, locale)}
      />
      {wizard && (
        <Wizard
          machine={R.find(R.propEq('deviceId', wizard))(machines)}
          onClose={() => setWizard(false)}
          save={save}
          error={error}
        />
      )}
    </>
  )
}

export default CashOut
