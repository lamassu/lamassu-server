import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'
import schema from 'src/pages/Services/schemas'
import { toNamespace } from 'src/utils/config'

import WizardSplash from './WizardSplash'
import WizardStep from './WizardStep'
import { has0Conf } from './helper'

const MAX_STEPS = 5
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
  fiatCurrency,
  save,
  error
}) => {
  const [{ step, config, accountsToSave }, setState] = useState({
    step: 0,
    config: { active: true },
    accountsToSave: {}
  })

  const title = `Enable ${coin.display}`

  const tickers = { filled: filterConfig(coin.code, 'ticker')(accountsConfig) }
  const wallets = getItems(accountsConfig, accounts, 'wallet', coin.code)
  const exchanges = getItems(accountsConfig, accounts, 'exchange', coin.code)
  const zeroConfs = getItems(accountsConfig, accounts, 'zeroConf', coin.code)

  const getValue = code => R.find(R.propEq('code', code))(accounts)

  const commonWizardSteps = [
    { type: 'ticker', ...tickers },
    { type: 'wallet', ...wallets },
    { type: 'exchange', ...exchanges }
  ]

  const hasZeroConfs =
    !R.isEmpty(zeroConfs.filled) ||
    (!R.isNil(zeroConfs.unfilled) && !R.isEmpty(zeroConfs.unfilled))

  const confidenceCheckingStep = {
    type: 'zeroConf',
    name: 'confidence checking',
    schema: Yup.object().shape({
      zeroConfLimit: Yup.number().required()
    }),
    ...zeroConfs
  }

  const zeroConfLimitStep = {
    type: 'zeroConfLimit',
    name: '0-conf limit'
  }

  const wizardSteps = hasZeroConfs
    ? R.concat(
        commonWizardSteps,
        has0Conf(coin)
          ? [confidenceCheckingStep]
          : [confidenceCheckingStep, zeroConfLimitStep]
      )
    : commonWizardSteps

  const lastStep = wizardSteps.length
  const isLastStep = step === lastStep
  const stepData = step > 0 ? wizardSteps[step - 1] : null

  const onContinue = async (stepConfig, stepAccount) => {
    const newConfig = R.merge(config, stepConfig)
    const newAccounts = stepAccount
      ? R.merge(accountsToSave, stepAccount)
      : accountsToSave

    if (isLastStep) {
      return save(toNamespace(coin.code, newConfig), newAccounts)
    }

    setState({
      step: step + 1,
      config: newConfig,
      accountsToSave: newAccounts
    })
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
          coin={coin.display}
          fiatCurrency={fiatCurrency}
          error={error}
          step={step}
          maxSteps={MAX_STEPS}
          lastStep={lastStep}
          isLastStep={isLastStep}
          {...stepData}
          onContinue={onContinue}
          getValue={getValue}
        />
      )}
    </Modal>
  )
}

export default Wizard
