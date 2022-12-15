import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { HelpTooltip } from 'src/components/Tooltip'
import { Link, SupportLinkButton } from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import { P, Label2 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import twilioSchema from 'src/pages/Services/schemas/twilio'
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

const SAVE_ACCOUNT = gql`
  mutation Save($accounts: JSONObject) {
    saveAccounts(accounts: $accounts)
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const GET_CONFIG = gql`
  query getData {
    config
    accounts
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
  const { data, loading: configLoading } = useQuery(GET_CONFIG)
  const { data: customInfoReqData, loading: customInfoLoading } = useQuery(
    GET_CUSTOM_REQUESTS
  )
  const [error, setError] = useState(null)
  const [subMenu, setSubMenu] = useState(false)

  const [twilioSetupPopup, setTwilioSetupPopup] = useState(false)

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

  const [saveAccount] = useMutation(SAVE_ACCOUNT, {
    onCompleted: () => {
      setTwilioSetupPopup(false)
      toggleWizard('newTrigger')()
    },
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

  const loading = configLoading || customInfoLoading

  const twilioSave = it => {
    setError(null)
    return saveAccount({
      variables: { accounts: { twilio: it } }
    })
  }
  const addNewTriger = () => {
    if (!R.has('twilio', data?.accounts || {})) setTwilioSetupPopup(true)
    else toggleWizard('newTrigger')()
  }

  return (
    <>
      <TitleSection
        title="Compliance triggers"
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
              justifyContent="flex-end"
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
              <HelpTooltip width={304}>
                <P>
                  This option requires a user to scan a fresh wallet address if
                  they attempt to scan one that had been previously used for a
                  transaction in your network.
                </P>
                <P>
                  For details please read the relevant knowledgebase article:
                </P>
                <SupportLinkButton
                  link="https://support.lamassu.is/hc/en-us/articles/360033622211-Reject-Address-Reuse"
                  label="Reject Address Reuse"
                  bottomSpace="1"
                />
              </HelpTooltip>
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
            <Link color="primary" onClick={addNewTriger}>
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
          addNewTriger={addNewTriger}
          customInfoRequests={enabledCustomInfoRequests}
        />
      )}
      {!loading && subMenu === 'advancedSettings' && (
        <AdvancedTriggers
          error={error}
          save={saveConfig}
          data={data}></AdvancedTriggers>
      )}
      {twilioSetupPopup && (
        <Modal
          title={`Configure SMS`}
          width={478}
          handleClose={() => setTwilioSetupPopup(false)}
          open={true}>
          <P>
            In order for compliance triggers to work, you'll first need to
            configure Twilio.
          </P>
          <SupportLinkButton
            link="https://support.lamassu.is/hc/en-us/articles/115001203951-Twilio-for-SMS"
            label="Lamassu Support Article"
          />
          <FormRenderer
            save={twilioSave}
            elements={twilioSchema.elements}
            validationSchema={twilioSchema.getValidationSchema}
          />
        </Modal>
      )}
    </>
  )
}

export default Triggers
