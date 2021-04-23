import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
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
import { ReactComponent as ReverseCustomInfoIcon } from 'src/styling/icons/circle buttons/filter/white.svg'
import { ReactComponent as CustomInfoIcon } from 'src/styling/icons/circle buttons/filter/zodiac.svg'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import CustomInfoRequests from '../CustomInfoRequests'

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
  const [wizardType, setWizard] = useState(false)
  const [showCustomInfoRequests, setShowCustomInfoRequests] = useState(false)
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

  const titleSectionWidth = {
    [classes.tableWidth]: !showCustomInfoRequests
  }

  const customRequests = [
    {
      name: 'Date of Birth',
      screen1: {
        text: 'Please enter date of birth',
        title: 'Date of birth'
      },
      screen2: {
        title: 'Date of Birth'
      },
      input: {
        type: 'numerical',
        constraintType: 'date'
      }
    }
  ]

  const toggleCustomRequestWizard = () => {
    document.querySelector('#root').classList.toggle('root-blur')
    const wizardOpen = !!wizardType
    return wizardOpen ? setWizard(false) : setWizard('newCustomRequest')
  }

  return (
    <>
      <TitleSection
        title="Compliance Triggers"
        className={classnames(titleSectionWidth)}
        button={{
          text: 'Custom info requests',
          icon: CustomInfoIcon,
          inverseIcon: ReverseCustomInfoIcon,
          toggle: setShowCustomInfoRequests
        }}>
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
        {showCustomInfoRequests && customRequests.length > 0 && (
          <Box display="flex" justifyContent="flex-end">
            <Link color="primary" onClick={toggleCustomRequestWizard}>
              Add new custom info request
            </Link>
          </Box>
        )}
      </TitleSection>
      {showCustomInfoRequests ? (
        <CustomInfoRequests
          customRequests={customRequests}
          showWizard={wizardType === 'newCustomRequest'}
          toggleWizard={toggleCustomRequestWizard}
        />
      ) : (
        <>
          <Box
            marginBottom={2}
            className={classes.tableWidth}
            display="flex"
            justifyContent="flex-end">
            {!loading && !R.isEmpty(triggers) && (
              <Link color="primary" onClick={() => setWizard('newTrigger')}>
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
          {wizardType === 'newTrigger' && (
            <Wizard
              currency={currency}
              error={error?.message}
              save={add}
              onClose={() => setWizard(null)}
            />
          )}
          {!loading && R.isEmpty(triggers) && (
            <Box
              display="flex"
              alignItems="center"
              flexDirection="column"
              mt={15}>
              <H2>
                It seems there are no active compliance triggers on your network
              </H2>
              <Button onClick={() => setWizard(true)}>Add first trigger</Button>
            </Box>
          )}
        </>
      )}
    </>
  )
}

export default Triggers
