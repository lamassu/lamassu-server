import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import React, { memo } from 'react'

import { Tooltip } from 'src/components/Tooltip'
import { BooleanPropertiesTable } from 'src/components/booleanPropertiesTable'
import { Switch } from 'src/components/inputs'
import { H4, P, Label2 } from 'src/components/typography'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import { global } from './OperatorInfo.styles'

const useStyles = makeStyles(global)

const GET_CONFIG = gql`
  query getData {
    config
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const Row = memo(({ title, disabled = false, checked, save, label }) => {
  const classes = useStyles()

  return (
    <div className={classes.switchRow}>
      <P>{title}</P>
      <div className={classes.switch}>
        <Switch
          disabled={disabled}
          checked={checked}
          onChange={event => save && save(event.target.checked)}
        />
        {label && <Label2>{label}</Label2>}
      </div>
    </div>
  )
})

const CoinATMRadar = memo(({ wizard }) => {
  const classes = useStyles()

  const { data } = useQuery(GET_CONFIG)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: ['getData']
  })

  const save = it =>
    saveConfig({
      variables: { config: toNamespace(namespaces.COIN_ATM_RADAR, it) }
    })

  const coinAtmRadarConfig =
    data?.config && fromNamespace(namespaces.COIN_ATM_RADAR, data.config)
  if (!coinAtmRadarConfig) return null

  return (
    <div className={classes.content}>
      <div>
        <div className={classes.header}>
          <H4>Coin ATM Radar share settings</H4>
          <Tooltip width={304}>
            <P>
              For details on configuring this panel, please read the relevant
              knowledgebase article{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://support.lamassu.is/hc/en-us/articles/360023720472-Coin-ATM-Radar">
                here
              </a>
              .
            </P>
          </Tooltip>
        </div>
        <Row
          title={'Share information?'}
          checked={coinAtmRadarConfig.active}
          save={value => save({ active: value })}
          label={coinAtmRadarConfig.active ? 'Yes' : 'No'}
        />
        <BooleanPropertiesTable
          editing={wizard}
          title="Machine info"
          data={coinAtmRadarConfig}
          elements={[
            {
              name: 'commissions',
              display: 'Commissions'
            },
            {
              name: 'limitsAndVerification',
              display: 'Limits and verification'
            }
          ]}
          save={save}
        />
      </div>
    </div>
  )
})

export default CoinATMRadar
