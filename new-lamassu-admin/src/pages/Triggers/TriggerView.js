import { useMutation } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import { v4 } from 'uuid'

import { Button } from 'src/components/buttons'
import { Table as EditableTable } from 'src/components/editableTable'
import { H2 } from 'src/components/typography'
import { fromNamespace, namespaces } from 'src/utils/config'

import styles from './Triggers.styles'
import Wizard from './Wizard'
import { Schema, getElements, sortBy, toServer } from './helper'

const useStyles = makeStyles(styles)

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const TriggerView = ({
  triggers,
  showWizard,
  config,
  toggleWizard,
  customInfoRequests
}) => {
  const currency = R.path(['fiatCurrency'])(
    fromNamespace(namespaces.LOCALE)(config)
  )
  const classes = useStyles()
  const [error, setError] = useState(null)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: () => toggleWizard('off'),
    refetchQueries: () => ['getData'],
    onError: error => setError(error)
  })

  const save = config => {
    setError(null)
    return saveConfig({
      variables: { config: { triggers: toServer(config.triggers) } }
    })
  }

  const add = rawConfig => {
    const toSave = R.concat([{ id: v4(), direction: 'both', ...rawConfig }])(
      triggers
    )
    return saveConfig({ variables: { config: { triggers: toServer(toSave) } } })
  }

  return (
    <>
      <EditableTable
        data={triggers}
        name="triggers"
        enableEdit
        sortBy={sortBy}
        groupBy="triggerType"
        enableDelete
        error={error?.message}
        save={save}
        validationSchema={Schema}
        elements={getElements(currency, classes, customInfoRequests)}
      />
      {showWizard && (
        <Wizard
          currency={currency}
          error={error?.message}
          save={add}
          onClose={toggleWizard}
        />
      )}
      {R.isEmpty(triggers) && (
        <Box display="flex" alignItems="center" flexDirection="column" mt={15}>
          <H2>
            It seems there are no active compliance triggers on your network
          </H2>
          <Button onClick={() => toggleWizard()}>Add first trigger</Button>
        </Box>
      )}
    </>
  )
}

export default TriggerView
