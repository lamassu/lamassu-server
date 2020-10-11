import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import { v4 } from 'uuid'

import Tooltip from 'src/components/Tooltip'
import { Link } from 'src/components/buttons'
import { Table as EditableTable } from 'src/components/editableTable'
import { Switch } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import { P, Label2 } from 'src/components/typography'
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
  const [error, setError] = useState(false)

  const { data } = useQuery(GET_INFO)
  const triggers = fromServer(data?.config?.triggers ?? [])

  const complianceConfig =
    data?.config && fromNamespace('compliance')(data.config)
  const rejectAddressReuse = complianceConfig?.rejectAddressReuse ?? false

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setWizard(false),
    onError: () => setError(true),
    refetchQueries: () => ['getData']
  })

  const add = rawConfig => {
    const toSave = R.concat([{ id: v4(), direction: 'both', ...rawConfig }])(
      triggers
    )
    setError(false)
    return saveConfig({ variables: { config: { triggers: toServer(toSave) } } })
  }

  const addressReuseSave = rawConfig => {
    const config = toNamespace('compliance')(rawConfig)
    return saveConfig({ variables: { config } })
  }

  const save = config => {
    setError(false)
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
                The "Reject reused addresses" option means that all addresses
                that are used once will be automatically rejected if there's an
                attempt to use them again on a new transaction.
              </P>
            </Tooltip>
          </Box>
        </Box>
      </TitleSection>
      <Box
        marginBottom={2}
        className={classes.tableWidth}
        display="flex"
        justifyContent="end">
        <Link color="primary" onClick={() => setWizard(true)}>
          + Add new trigger
        </Link>
      </Box>
      <EditableTable
        data={triggers}
        name="triggers"
        enableEdit
        sortBy={sortBy}
        groupBy="triggerType"
        enableDelete
        save={save}
        validationSchema={Schema}
        elements={getElements(currency, classes)}
      />
      {wizard && (
        <Wizard
          currency={currency}
          error={error}
          save={add}
          onClose={() => setWizard(null)}
        />
      )}
    </>
  )
}

export default Triggers
