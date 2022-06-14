import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { Link } from 'src/components/buttons'
import { Table as EditableTable } from 'src/components/editableTable'
import Section from 'src/components/layout/Section'
import TitleSection from 'src/components/layout/TitleSection'
import { P } from 'src/components/typography'
import Wizard from 'src/pages/Wallet/Wizard'
import { WalletSchema } from 'src/pages/Wallet/helper'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import { styles } from './Locales.styles'
import {
  mainFields,
  overrides,
  LocaleSchema,
  OverridesSchema,
  localeDefaults,
  overridesDefaults
} from './helper'

const useStyles = makeStyles(styles)

const GET_DATA = gql`
  query getData {
    config
    accounts
    accountsConfig {
      code
      display
      class
      cryptos
    }
    currencies {
      code
      display
    }
    countries {
      code
      display
    }
    cryptoCurrencies {
      code
      display
    }
    languages {
      code
      display
    }
    machines {
      name
      deviceId
    }
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject, $accounts: JSONObject) {
    saveConfig(config: $config)
    saveAccounts(accounts: $accounts)
  }
`

const FiatCurrencyChangeAlert = ({ open, close, save }) => {
  const classes = useStyles()

  return (
    <Modal
      title={'Change fiat currency?'}
      handleClose={close}
      width={450}
      height={310}
      open={open}>
      <P>
        Please note that all values you set that were based on your prior fiat
        currency are still the same. If you need to adjust these to reflect the
        new fiat currency (such as minimum transaction amounts, fixed fees, and
        compliance triggers, for example), please do so now.
      </P>
      <P>
        Also, if you have cash-out enabled, you must define new dispenser bill
        counts for the new currency for cash-out on the new currency to work.
      </P>
      <div className={classes.rightAligned}>
        <Link onClick={close} color="secondary">
          Cancel
        </Link>
        <Link className={classes.rightLink} onClick={save} color="primary">
          Save
        </Link>
      </div>
    </Modal>
  )
}

const Locales = ({ name: SCREEN_KEY }) => {
  const [wizard, setWizard] = useState(false)
  const [onChangeFunction, setOnChangeFunction] = useState(null)
  const [error, setError] = useState(null)
  const [isEditingDefault, setEditingDefault] = useState(false)
  const [isEditingOverrides, setEditingOverrides] = useState(false)
  const { data } = useQuery(GET_DATA)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setWizard(false),
    refetchQueries: () => ['getData'],
    onError: error => setError(error)
  })

  const [dataToSave, setDataToSave] = useState(null)

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)
  const wallets = data?.config && fromNamespace(namespaces.WALLETS)(data.config)

  const accountsConfig = data?.accountsConfig
  const accounts = data?.accounts ?? []
  const cryptoCurrencies = data?.cryptoCurrencies ?? []
  const locale = config && !R.isEmpty(config) ? config : localeDefaults
  const localeOverrides = locale.overrides ?? []

  const handleSave = it => {
    const newConfig = toNamespace(SCREEN_KEY)(it.locale[0])

    if (
      config.fiatCurrency &&
      newConfig.locale_fiatCurrency !== config.fiatCurrency
    )
      return setDataToSave(newConfig)

    return save(newConfig)
  }

  const save = (config, accounts) => {
    setDataToSave(null)
    return saveConfig({ variables: { config, accounts } })
  }

  const saveOverrides = it => {
    const config = toNamespace(SCREEN_KEY)(it)
    setError(null)
    return saveConfig({ variables: { config } })
  }

  const onChangeCoin = (prev, curr, setValue) => {
    const coin = R.difference(curr, prev)[0]
    if (!coin) return setValue(curr)

    const namespaced = fromNamespace(coin)(wallets)
    if (!WalletSchema.isValidSync(namespaced)) {
      setOnChangeFunction(() => () => setValue(curr))
      setWizard(coin)
      return
    }

    setValue(curr)
  }

  const onEditingDefault = (it, editing) => setEditingDefault(editing)
  const onEditingOverrides = (it, editing) => setEditingOverrides(editing)

  const wizardSave = (config, accounts) =>
    save(toNamespace(namespaces.WALLETS)(config), accounts).then(it => {
      onChangeFunction()
      setOnChangeFunction(null)
      return it
    })

  return (
    <>
      <FiatCurrencyChangeAlert
        open={dataToSave}
        close={() => setDataToSave(null)}
        save={() => dataToSave && save(dataToSave)}
      />
      <TitleSection title="Locales" />
      <Section>
        <EditableTable
          title="Default settings"
          error={error?.message}
          titleLg
          name="locale"
          enableEdit
          initialValues={locale}
          save={handleSave}
          validationSchema={LocaleSchema}
          data={R.of(locale)}
          elements={mainFields(data, onChangeCoin)}
          setEditing={onEditingDefault}
          forceDisable={isEditingOverrides}
        />
      </Section>
      <Section>
        <EditableTable
          error={error?.message}
          title="Overrides"
          titleLg
          name="overrides"
          enableDelete
          enableEdit
          enableCreate
          initialValues={overridesDefaults}
          save={saveOverrides}
          validationSchema={OverridesSchema}
          data={localeOverrides ?? []}
          elements={overrides(data, localeOverrides, onChangeCoin)}
          disableAdd={R.compose(R.isEmpty, R.difference)(
            data?.machines.map(m => m.deviceId) ?? [],
            localeOverrides?.map(o => o.machine) ?? []
          )}
          setEditing={onEditingOverrides}
          forceDisable={isEditingDefault}
        />
      </Section>
      {wizard && (
        <Wizard
          coin={R.find(R.propEq('code', wizard))(cryptoCurrencies)}
          onClose={() => setWizard(false)}
          save={wizardSave}
          error={error?.message}
          cryptoCurrencies={cryptoCurrencies}
          userAccounts={data?.config?.accounts}
          accounts={accounts}
          accountsConfig={accountsConfig}
        />
      )}
    </>
  )
}

export default Locales
