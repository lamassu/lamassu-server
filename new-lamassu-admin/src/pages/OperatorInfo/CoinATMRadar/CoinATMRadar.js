import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState, memo } from 'react'

import Tooltip from 'src/components/Tooltip'
import { Switch } from 'src/components/inputs'
import { H4, P, Label2 } from 'src/components/typography'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import { mainStyles } from './CoinATMRadar.styles'

const useStyles = makeStyles(mainStyles)

const initialValues = {
  active: false,
  commissions: false,
  limitsAndVerification: false
}

const GET_CONFIG = gql`
  {
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
    <div className={classes.rowWrapper}>
      <div className={classes.rowTextAndSwitch}>
        <P>{title}</P>
        <Switch
          disabled={disabled}
          checked={checked}
          onChange={event => save && save(event.target.checked)}
        />
      </div>
      {label && <Label2>{label}</Label2>}
    </div>
  )
})

const CoinATMRadar = memo(() => {
  const [coinAtmRadarConfig, setCoinAtmRadarConfig] = useState(null)

  const classes = useStyles()

  const { refetch: getCoinAtmRadarConfig } = useQuery(GET_CONFIG, {
    onCompleted: configResponse => {
      const response = fromNamespace(
        namespaces.COIN_ATM_RADAR,
        configResponse.config
      )
      const values = R.merge(initialValues, response)
      setCoinAtmRadarConfig(values)
    }
  })

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: configResponse => {
      setCoinAtmRadarConfig(
        fromNamespace(namespaces.COIN_ATM_RADAR, configResponse.saveConfig)
      )

      getCoinAtmRadarConfig()
    }
  })

  const save = it =>
    saveConfig({
      variables: { config: toNamespace(namespaces.COIN_ATM_RADAR, it) }
    })

  if (!coinAtmRadarConfig) return null

  return (
    <div className={classes.content}>
      <div>
        <div className={classes.titleWrapper}>
          <H4>Coin ATM Radar share settings</H4>
          <Tooltip enableClick width={304} Icon={HelpIcon}>
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
        <H4>{'Machine info'}</H4>
        <Row
          title={'Commissions'}
          disabled={!coinAtmRadarConfig.active}
          checked={coinAtmRadarConfig.commissions}
          save={value => save({ commissions: value })}
        />
        <Row
          title={'Limits and verification'}
          disabled={!coinAtmRadarConfig.active}
          checked={coinAtmRadarConfig.limitsAndVerification}
          save={value => save({ limitsAndVerification: value })}
        />
      </div>
    </div>
  )
})

export default CoinATMRadar
