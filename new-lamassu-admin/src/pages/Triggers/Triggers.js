import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Tooltip } from 'src/components/Tooltip'
import { Link } from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import { P, Label2 } from 'src/components/typography'
import { ReactComponent as ReverseCustomInfoIcon } from 'src/styling/icons/circle buttons/filter/white.svg'
import { ReactComponent as CustomInfoIcon } from 'src/styling/icons/circle buttons/filter/zodiac.svg'
import { ReactComponent as ReverseSettingsIcon } from 'src/styling/icons/circle buttons/settings/white.svg'
import { ReactComponent as SettingsIcon } from 'src/styling/icons/circle buttons/settings/zodiac.svg'
import { fromNamespace, toNamespace } from 'src/utils/config'

import CustomInfoRequests from './CustomInfoRequests'
import TriggerView from './TriggerView'
import styles from './Triggers.styles'
import AdvancedTriggers from './components/AdvancedTriggers'
import { fromServer } from './helper'
const useStyles = makeStyles(styles)

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const GET_CONFIG = gql`
  query getData {
    config
  }
`

const GET_CUSTOM_REQUESTS = gql`
  query customInfoRequests {
    customInfoRequests {
      id
      customRequest
      enabled
    }
  }
`

const Triggers = () => {
  const classes = useStyles()
  const [wizardType, setWizard] = useState(false)
  const { data, loading } = useQuery(GET_CONFIG)
  const { data: customInfoReqData } = useQuery(GET_CUSTOM_REQUESTS)
  const [error, setError] = useState(null)
  const [subMenu, setSubMenu] = useState(false)

  const customInfoRequests =
    R.path(['customInfoRequests'])(customInfoReqData) ?? []
  const enabledCustomInfoRequests = R.filter(R.propEq('enabled', true))(
    customInfoRequests
  )

  const triggers = fromServer(data?.config?.triggers ?? [])
  const complianceConfig =
    data?.config && fromNamespace('compliance')(data.config)
  const rejectAddressReuse = complianceConfig?.rejectAddressReuse ?? false

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setWizard(false),
    refetchQueries: () => ['getData'],
    onError: error => setError(error)
  })

  const addressReuseSave = rawConfig => {
    const config = toNamespace('compliance')(rawConfig)
    return saveConfig({ variables: { config } })
  }

  const titleSectionWidth = {
    [classes.tableWidth]: !subMenu === 'customInfoRequests'
  }

  const setBlur = shouldBlur => {
    return shouldBlur
      ? document.querySelector('#root').classList.add('root-blur')
      : document.querySelector('#root').classList.remove('root-blur')
  }

  const toggleWizard = wizardName => forceDisable => {
    if (wizardType === wizardName || forceDisable) {
      setBlur(false)
      return setWizard(null)
    }
    setBlur(true)
    return setWizard(wizardName)
  }

  return (
    <>
      <TitleSection
        title="Compliance Triggers"
        buttons={[
          {
            text: 'Advanced settings',
            icon: SettingsIcon,
            inverseIcon: ReverseSettingsIcon,
            forceDisable: !(subMenu === 'advancedSettings'),
            toggle: show => {
              setSubMenu(show ? 'advancedSettings' : false)
            }
          },
          {
            text: 'Custom info requests',
            icon: CustomInfoIcon,
            inverseIcon: ReverseCustomInfoIcon,
            forceDisable: !(subMenu === 'customInfoRequests'),
            toggle: show => {
              setSubMenu(show ? 'customInfoRequests' : false)
            }
          }
        ]}
        className={classnames(titleSectionWidth)}>
        {!subMenu && (
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
        )}
        {subMenu === 'customInfoRequests' &&
          !R.isEmpty(enabledCustomInfoRequests) && (
            <Box display="flex" justifyContent="flex-end">
              <Link
                color="primary"
                onClick={() => toggleWizard('newCustomRequest')()}>
                + Add new custom info request
              </Link>
            </Box>
          )}
        {!loading && !subMenu && !R.isEmpty(triggers) && (
          <Box display="flex" justifyContent="flex-end">
            <Link color="primary" onClick={() => toggleWizard('newTrigger')()}>
              + Add new trigger
            </Link>
          </Box>
        )}
      </TitleSection>
      {!loading && subMenu === 'customInfoRequests' && (
        <CustomInfoRequests
          data={enabledCustomInfoRequests}
          showWizard={wizardType === 'newCustomRequest'}
          toggleWizard={toggleWizard('newCustomRequest')}
        />
      )}
      {!loading && !subMenu && (
        <TriggerView
          triggers={triggers}
          showWizard={wizardType === 'newTrigger'}
          config={data?.config ?? {}}
          toggleWizard={toggleWizard('newTrigger')}
          customInfoRequests={customInfoRequests}
        />
      )}
      {!loading && subMenu === 'advancedSettings' && (
        <AdvancedTriggers
          error={error}
          save={saveConfig}
          data={data}></AdvancedTriggers>
      )}
    </>
  )
}

export default Triggers
