import { useQuery, useMutation } from '@apollo/react-hooks'
import { DialogActions, makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { IconButton, Button } from 'src/components/buttons'
import { NamespacedTable as EditableTable } from 'src/components/editableTable'
import { RadioGroup } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import { P, Label1 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import schemas from 'src/pages/Services/schemas'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as ReverseSettingsIcon } from 'src/styling/icons/circle buttons/settings/white.svg'
import { ReactComponent as SettingsIcon } from 'src/styling/icons/circle buttons/settings/zodiac.svg'
import { fromNamespace, toNamespace } from 'src/utils/config'

import AdvancedWallet from './AdvancedWallet'
import styles from './Wallet.styles.js'
import Wizard from './Wizard'
import { WalletSchema, getElements } from './helper'

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

const LOCALE = 'locale'

const useStyles = makeStyles(styles)

const Wallet = ({ name: SCREEN_KEY }) => {
  const classes = useStyles()
  const [editingFeeDiscount, setEditingFeeDiscount] = useState(null)
  const [selectedDiscount, setSelectedDiscount] = useState(null)
  const [editingSchema, setEditingSchema] = useState(null)
  const [onChangeFunction, setOnChangeFunction] = useState(null)
  const [wizard, setWizard] = useState(false)
  const [advancedSettings, setAdvancedSettings] = useState(false)
  const { data } = useQuery(GET_INFO)

  const [saveConfig, { error }] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setWizard(false),
    refetchQueries: () => ['getData']
  })

  const [saveAccount] = useMutation(SAVE_ACCOUNT, {
    onCompleted: () => setEditingSchema(null),
    refetchQueries: () => ['getData']
  })

  const save = (rawConfig, accounts) => {
    const config = toNamespace(SCREEN_KEY)(rawConfig)
    return saveConfig({ variables: { config, accounts } })
  }

  const fiatCurrency =
    data?.config && fromNamespace(LOCALE)(data.config).fiatCurrency

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)
  const accountsConfig = data?.accountsConfig
  const cryptoCurrencies = data?.cryptoCurrencies ?? []
  const accounts = data?.accounts ?? []

  const onChange = (previous, current, setValue) => {
    if (!current) return setValue(current)

    if (!accounts[current] && schemas[current]) {
      setEditingSchema(schemas[current])
      setOnChangeFunction(() => () => setValue(current))
      return
    }

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
      onChangeFunction()
      setOnChangeFunction(null)
      return it
    })

  const saveFeeDiscount = rawConfig => {
    const config = toNamespace(SCREEN_KEY)(rawConfig)
    setEditingFeeDiscount(false)
    return saveConfig({ variables: { config } })
  }

  const handleRadioButtons = evt => {
    const selectedDiscount = R.path(['target', 'value'])(evt)
    setSelectedDiscount(selectedDiscount)
  }

  const radioButtonOptions = [
    { display: '+20%', code: '1.2' },
    { display: 'Default', code: '1' },
    { display: '-20%', code: '0.8' },
    { display: '-40%', code: '0.6' },
    { display: '-60%', code: '0.4' }
  ]

  return (
    <>
      <TitleSection
        title="Wallet Settings"
        button={{
          text: 'Advanced settings',
          icon: SettingsIcon,
          inverseIcon: ReverseSettingsIcon,
          toggle: setAdvancedSettings
        }}
      />
      {!advancedSettings && (
        <>
          <Box alignItems="center" justifyContent="end">
            <Label1 className={classes.cashboxReset}>Fee discount</Label1>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="end"
              mr="-4px">
              <P className={classes.selection}>{selectedDiscount}</P>
              <IconButton
                onClick={() => setEditingFeeDiscount(true)}
                className={classes.button}>
                <EditIcon />
              </IconButton>
            </Box>
          </Box>
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
              handleClose={() => setEditingSchema(null)}
              open={true}>
              <FormRenderer
                save={wizardSave}
                elements={editingSchema.elements}
                validationSchema={editingSchema.validationSchema}
                value={accounts[editingSchema.code]}
              />
            </Modal>
          )}
        </>
      )}
      {advancedSettings && <AdvancedWallet></AdvancedWallet>}
      {editingFeeDiscount && (
        <Modal
          title={'Fee discount for BTC'}
          width={478}
          handleClose={() => setEditingFeeDiscount(null)}
          open={true}>
          <P className={classes.descriptions}>
            Set a priority level for your outgoing BTC transactions, selecting a
            percentage off of the fee estimate your wallet uses.
          </P>
          <RadioGroup
            name="set-automatic-reset"
            value={selectedDiscount}
            options={radioButtonOptions}
            onChange={handleRadioButtons}
            className={classes.radioButtons}
          />
          <DialogActions className={classes.actions}>
            <Button
              onClick={() =>
                saveFeeDiscount({ BTC_feeDiscount: selectedDiscount })
              }>
              Confirm
            </Button>
          </DialogActions>
        </Modal>
      )}
    </>
  )
}

export default Wallet
