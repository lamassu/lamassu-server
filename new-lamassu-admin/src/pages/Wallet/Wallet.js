import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { HelpTooltip } from 'src/components/Tooltip'
import { SupportLinkButton, Button } from 'src/components/buttons'
import { NamespacedTable as EditableTable } from 'src/components/editableTable'
import TitleSection from 'src/components/layout/TitleSection'
import { P, Info2 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import _schemas from 'src/pages/Services/schemas'
import { ReactComponent as ReverseSettingsIcon } from 'src/styling/icons/circle buttons/settings/white.svg'
import { ReactComponent as SettingsIcon } from 'src/styling/icons/circle buttons/settings/zodiac.svg'
import { spacer } from 'src/styling/variables'
import { fromNamespace, toNamespace } from 'src/utils/config'

import AdvancedWallet from './AdvancedWallet'
import Wizard from './Wizard'
import { WalletSchema, getElements } from './helper'

const useStyles = makeStyles({
  submit: {
    margin: [['auto', 0, 0, 'auto']]
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, spacer * 3, 0]]
  }
})

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject, $accounts: JSONObject) {
    saveConfig(config: $config)
    saveAccounts(accounts: $accounts)
  }
`

const SAVE_ACCOUNT = gql`
  mutation Save($accounts: JSONObject) {
    saveAccounts(accounts: $accounts)
  }
`

const GET_INFO = gql`
  query getData {
    config
    accounts
    accountsConfig {
      code
      display
      class
      cryptos
      deprecated
    }
    cryptoCurrencies {
      code
      display
    }
  }
`

const GET_MARKETS = gql`
  query getMarkets {
    getMarkets
  }
`

const LOCALE = 'locale'

const Wallet = ({ name: SCREEN_KEY }) => {
  const [cashInOnlyWallet, setCashInOnlyWallet] = useState(null)
  const [editingSchema, setEditingSchema] = useState(null)
  const [onChangeFunction, setOnChangeFunction] = useState(null)
  const [wizard, setWizard] = useState(false)
  const [advancedSettings, setAdvancedSettings] = useState(false)
  const { data } = useQuery(GET_INFO)

  const [saveConfig, { error }] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setWizard(false),
    refetchQueries: () => ['getData']
  })

  const { data: marketsData } = useQuery(GET_MARKETS)

  const classes = useStyles()

  const [saveAccount] = useMutation(SAVE_ACCOUNT, {
    onCompleted: () => setEditingSchema(null),
    refetchQueries: () => ['getData']
  })

  const save = (rawConfig, accounts) => {
    const config = toNamespace(SCREEN_KEY)(rawConfig)
    return saveConfig({ variables: { config, accounts } })
  }

  const checkCashInConstraints = current => {
    if (R.includes(current, ['coinbasepro']) && schemas[current])
      setCashInOnlyWallet(schemas[current].name)
  }

  const fiatCurrency =
    data?.config && fromNamespace(LOCALE)(data.config).fiatCurrency

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)
  const accountsConfig = data?.accountsConfig
  const cryptoCurrencies = data?.cryptoCurrencies ?? []
  const accounts = data?.accounts ?? []

  const markets = marketsData?.getMarkets

  const schemas = _schemas({ markets })

  const onChange = (previous, current, setValue) => {
    if (!current) return setValue(current)

    if (!accounts[current] && schemas[current]) {
      setEditingSchema(schemas[current])
      setOnChangeFunction(() => () => setValue(current))
      return
    }

    checkCashInConstraints(current)

    setValue(current)
  }

  const shouldOverrideEdit = it => {
    const namespaced = fromNamespace(it)(config)
    return !WalletSchema.isValidSync(namespaced)
  }

  const wizardSave = it =>
    saveAccount({
      variables: { accounts: { [editingSchema.code]: it } }
    }).then(it => {
      checkCashInConstraints(editingSchema.code)
      onChangeFunction()
      setOnChangeFunction(null)
      return it
    })

  return (
    <>
      <TitleSection
        title="Wallet settings"
        buttons={[
          {
            text: 'Advanced settings',
            icon: SettingsIcon,
            inverseIcon: ReverseSettingsIcon,
            toggle: setAdvancedSettings
          }
        ]}
        appendix={
          <HelpTooltip width={340}>
            <P>
              For details on configuring wallets, please read the relevant
              knowledgebase article:
            </P>
            <SupportLinkButton
              link="https://support.lamassu.is/hc/en-us/articles/360000725832-Wallets-Exchange-Linkage-and-Volatility"
              label="Wallets, Exchange Linkage, and Volatility"
              bottomSpace="1"
            />
          </HelpTooltip>
        }
      />
      {!advancedSettings && (
        <>
          <EditableTable
            name="test"
            namespaces={R.map(R.path(['code']))(cryptoCurrencies)}
            data={config}
            error={error?.message}
            stripeWhen={it => !WalletSchema.isValidSync(it)}
            enableEdit
            shouldOverrideEdit={shouldOverrideEdit}
            editOverride={setWizard}
            editWidth={174}
            save={save}
            validationSchema={WalletSchema}
            elements={getElements(cryptoCurrencies, accountsConfig, onChange)}
          />
          {wizard && (
            <Wizard
              coin={R.find(R.propEq('code', wizard))(cryptoCurrencies)}
              onClose={() => setWizard(false)}
              save={save}
              error={error?.message}
              cryptoCurrencies={cryptoCurrencies}
              fiatCurrency={fiatCurrency}
              userAccounts={data?.config?.accounts}
              accounts={accounts}
              accountsConfig={accountsConfig}
            />
          )}
          {editingSchema && (
            <Modal
              title={`Edit ${editingSchema.name}`}
              width={478}
              handleClose={() => {
                checkCashInConstraints(editingSchema.code)
                setEditingSchema(null)
              }}
              open={true}>
              <FormRenderer
                save={wizardSave}
                elements={editingSchema.elements}
                validationSchema={editingSchema.validationSchema}
                value={accounts[editingSchema.code]}
              />
            </Modal>
          )}
          {cashInOnlyWallet && (
            <Modal
              title={'FYI'}
              width={478}
              handleClose={() => {
                setCashInOnlyWallet(null)
              }}
              open={true}>
              <P>
                Note: Coinbase Pro as a wallet is only compatible with cash-in,
                not cash-out.
              </P>
              <P>Please use this only if you have solely one-way machines.</P>
              <Info2>
                {
                  ' If you have a two-way machine, select another wallet option.'
                }
              </Info2>
              <div className={classes.footer}>
                <Button
                  className={classes.submit}
                  onClick={() => setCashInOnlyWallet(null)}>
                  Confirm
                </Button>
              </div>
            </Modal>
          )}
        </>
      )}
      {advancedSettings && <AdvancedWallet></AdvancedWallet>}
    </>
  )
}

export default Wallet
