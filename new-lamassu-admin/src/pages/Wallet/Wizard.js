import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import schema from 'src/pages/Services/schemas'
import { toNamespace } from 'src/utils/config'

import WizardSplash from './WizardSplash'
import WizardStep from './WizardStep'

const LAST_STEP = 4
const MODAL_WIDTH = 554

const contains = crypto => R.compose(R.contains(crypto), R.prop('cryptos'))
const sameClass = type => R.propEq('class', type)
const filterConfig = (crypto, type) =>
  R.filter(it => sameClass(type)(it) && contains(crypto)(it))
const removeDeprecated = R.filter(({ deprecated }) => !deprecated)

const getItems = (accountsConfig, accounts, type, crypto) => {
  const fConfig = removeDeprecated(filterConfig(crypto, type)(accountsConfig))

  const find = code => accounts && accounts[code]

  const [filled, unfilled] = R.partition(({ code }) => {
    const account = find(code)
    if (!schema[code]) return true

    const { getValidationSchema } = schema[code]
    return getValidationSchema(account).isValidSync(account)
  })(fConfig)

  return { filled, unfilled }
}

const Wizard = ({
  coin,
  onClose,
  accountsConfig,
  accounts,
  save,
  error,
  locale
}) => {
  const [{ step, config, accountsToSave }, setState] = useState({
    step: 0,
    config: { active: true },
    accountsToSave: {}
  })

  const title = `Enable ${coin.display}`
  const isLastStep = step === LAST_STEP

  const tickers = { filled: filterConfig(coin.code, 'ticker')(accountsConfig) }
  const wallets = getItems(accountsConfig, accounts, 'wallet', coin.code)
  const exchanges = getItems(accountsConfig, accounts, 'exchange', coin.code)
  const zeroConfs = getItems(accountsConfig, accounts, 'zeroConf', coin.code)

  const getValue = code => R.find(R.propEq('code', code))(accounts)

  const onContinue = async (stepConfig, stepAccount) => {
    const newConfig = R.merge(config, stepConfig)
    const newAccounts = stepAccount
      ? R.merge(accountsToSave, stepAccount)
      : accountsToSave

    if (isLastStep) {
      newConfig.zeroConfLimit = 0
      return save(toNamespace(coin.code, newConfig), newAccounts)
    }

    setState({
      step: step + 1,
      config: newConfig,
      accountsToSave: newAccounts
    })
  }

  const getStepData = () => {
    switch (step) {
      case 1:
        return { type: 'ticker', ...tickers }
      case 2:
        return { type: 'wallet', ...wallets }
      case 3:
        return { type: 'exchange', ...exchanges }
      case 4:
        return { type: 'zeroConf', name: 'zero conf', ...zeroConfs }
      default:
        return null
    }
  }

  return (
    <Modal
      title={step === 0 ? null : title}
      handleClose={onClose}
      width={MODAL_WIDTH}
      open={true}>
      {step === 0 && (
        <WizardSplash
          code={coin.code}
          name={coin.display}
          onContinue={() => onContinue()}
        />
      )}
      {step !== 0 && (
        <WizardStep
          step={step}
          error={error}
          lastStep={isLastStep}
          {...getStepData()}
          onContinue={onContinue}
          getValue={getValue}
          locale={locale}
        />
      )}
    </Modal>
  )
}

export default Wizard
