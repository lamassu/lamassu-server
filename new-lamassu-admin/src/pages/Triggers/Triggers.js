import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import { v4 } from 'uuid'

import { Tooltip } from 'src/components/Tooltip'
import { Link, Button } from 'src/components/buttons'
import { Table as EditableTable } from 'src/components/editableTable'
import { Switch } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import { P, Label2, H2 } from 'src/components/typography'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import styles from './Triggers.styles'
import Wizard from './Wizard'
import { Schema, getElements, sortBy, fromServer, toServer } from './helper'

const useStyles = makeStyles(styles)

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const GET_INFO = gql`
  query getData {
    config
  }
`

const Triggers = () => {
  const classes = useStyles()
  const [wizard, setWizard] = useState(false)

  const { data, loading } = useQuery(GET_INFO)
  const triggers = fromServer(data?.config?.triggers ?? [])

  const complianceConfig =
    data?.config && fromNamespace('compliance')(data.config)
  const rejectAddressReuse = complianceConfig?.rejectAddressReuse ?? false
  const [error, setError] = useState(null)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setWizard(false),
    refetchQueries: () => ['getData'],
    onError: error => setError(error)
  })

  const add = rawConfig => {
    const toSave = R.concat([{ id: v4(), direction: 'both', ...rawConfig }])(
      triggers
    )
    return saveConfig({ variables: { config: { triggers: toServer(toSave) } } })
  }

  const addressReuseSave = rawConfig => {
    const config = toNamespace('compliance')(rawConfig)
    return saveConfig({ variables: { config } })
  }

  const save = config => {
    setError(null)
    return saveConfig({
      variables: { config: { triggers: toServer(config.triggers) } }
    })
  }

  const currency = R.path(['fiatCurrency'])(
    fromNamespace(namespaces.LOCALE)(data?.config)
  )

  return (
    <>
      <TitleSection title="Compliance Triggers" className={classes.tableWidth}>
        <Box display="flex" alignItems="center">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="end"
            mr="-5px">
            <P>Reject reused addresses</P>
            <Switch
              checked={rejectAddressReuse}
              onChange={event => {
                addressReuseSave({ rejectAddressReuse: event.target.checked })
              }}
              value={rejectAddressReuse}
            />
            <Label2 className={classes.switchLabel}>
              {rejectAddressReuse ? 'On' : 'Off'}
            </Label2>
            <Tooltip width={304}>
              <P>
                This option requires a user to scan a different cryptocurrency
                address if they attempt to scan one that had been previously
                used for a transaction in your network
              </P>
            </Tooltip>
          </Box>
        </Box>
      </TitleSection>
      <Box
        marginBottom={2}
        className={classes.tableWidth}
        display="flex"
        justifyContent="flex-end">
        {!loading && !R.isEmpty(triggers) && (
          <Link color="primary" onClick={() => setWizard(true)}>
            + Add new trigger
          </Link>
        )}
      </Box>
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
        elements={getElements(currency, classes)}
      />
      {wizard && (
        <Wizard
          currency={currency}
          error={error?.message}
          save={add}
          onClose={() => setWizard(null)}
        />
      )}
      {!loading && R.isEmpty(triggers) && (
        <Box display="flex" alignItems="center" flexDirection="column" mt={15}>
          <H2>
            It seems there are no active compliance triggers on your network
          </H2>
          <Button onClick={() => setWizard(true)}>Add first trigger</Button>
        </Box>
      )}
    </>
  )
}

export default Triggers
