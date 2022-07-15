import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { memo } from 'react'

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

const MachineScreens = memo(({ wizard }) => {
  const classes = useStyles()

  const { data } = useQuery(GET_CONFIG)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  const machineScreensConfig =
    data?.config && fromNamespace(namespaces.MACHINE_SCREENS, data.config)

  const ratesScreenConfig =
    data?.config &&
    R.compose(
      fromNamespace('rates'),
      fromNamespace(namespaces.MACHINE_SCREENS)
    )(data.config)

  if (!machineScreensConfig) return null

  return (
    <>
      <div className={classes.header}>
        <H4>Rates screen</H4>
      </div>
      <div className={classes.switchRow}>
        <P>Enable rates screen</P>
        <div className={classes.switch}>
          <Switch
            checked={ratesScreenConfig.active}
            onChange={event =>
              saveConfig({
                variables: {
                  config: R.compose(
                    toNamespace(namespaces.MACHINE_SCREENS),
                    toNamespace('rates')
                  )(
                    R.merge(ratesScreenConfig, {
                      active: event.target.checked
                    })
                  )
                }
              })
            }
          />
          <Label2>{ratesScreenConfig.active ? 'Yes' : 'No'}</Label2>
        </div>
      </div>
    </>
  )
})

export default MachineScreens
