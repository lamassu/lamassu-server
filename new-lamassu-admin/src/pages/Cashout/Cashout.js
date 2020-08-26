import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import HelpTooltip from 'src/components/HelpTooltip'
import { NamespacedTable as EditableTable } from 'src/components/editableTable'
import { Switch } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import { P, Label2 } from 'src/components/typography'
import { fromNamespace, toNamespace } from 'src/utils/config'

import Wizard from './Wizard'
import { DenominationsSchema, getElements } from './helper'

const useStyles = makeStyles({
  fudgeFactor: {
    display: 'flex',
    alignItems: 'center',
    marginRight: 156
  },
  switchLabel: {
    margin: 6
  }
})

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
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
  const classes = useStyles()
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
  const fudgeFactorActive = config?.fudgeFactorActive ?? false
  const locale = data?.config && fromNamespace('locale')(data.config)
  const machines = data?.machines ?? []

  const onToggle = id => {
    const namespaced = fromNamespace(id)(config)
    if (!DenominationsSchema.isValidSync(namespaced)) return setWizard(id)
    save(toNamespace(id, { active: !namespaced?.active }))
  }

  return (
    <>
      <TitleSection title="Cash-out" error={error}>
        <div className={classes.fudgeFactor}>
          <P>Transaction fudge factor</P>
          <Switch
            checked={fudgeFactorActive}
            onChange={event => {
              save({ fudgeFactorActive: event.target.checked })
            }}
            value={fudgeFactorActive}
          />
          <Label2 className={classes.switchLabel}>
            {fudgeFactorActive ? 'On' : 'Off'}
          </Label2>
          <Tooltip width={304}>
            <P>
              Automatically accept customer deposits as complete if their
              received amount is 10 crypto atoms or less.
            </P>
            <P>
              (Crypto atoms are the smallest unit in each cryptocurrency. E.g.,
              satoshis in Bitcoin, or wei in Ethereum.)
            </P>
          </Tooltip>
        </div>
      </TitleSection>
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
