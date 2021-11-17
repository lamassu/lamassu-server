import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'

import WizardSplash from './WizardSplash'
import WizardStep from './WizardStep'

const MODAL_WIDTH = 554
const MODAL_HEIGHT = 520
const CASHBOX_DEFAULT_CAPACITY = 500

const Wizard = ({ machine, cashoutSettings, locale, onClose, save, error }) => {
  const [{ step, config }, setState] = useState({
    step: 0,
    config: { active: true }
  })

  const numberOfCassettes = machine.numberOfCassettes
  const numberOfCassetteSteps = R.isEmpty(cashoutSettings)
    ? 0
    : numberOfCassettes
  const LAST_STEP = numberOfCassetteSteps + 1

  const title = `Update counts`
  const isLastStep = step === LAST_STEP

  const onContinue = it => {
    const cashbox = config?.wasCashboxEmptied === 'YES' ? 0 : machine?.cashbox

    console.log('Wizard.js:Wizard:it', it)
    if (isLastStep) {
      save(
        machine.id,
        parseInt(cashbox),
        parseInt(it[1] ?? 0),
        parseInt(it[2] ?? 0),
        parseInt(it[3] ?? 0),
        parseInt(it[4] ?? 0)
      )
      return onClose()
    }

    const newConfig = R.merge(config, it)
    setState({
      step: step + 1,
      config: newConfig
    })
  }

  const makeCassetteSteps = R.pipe(
    R.range(1),
    R.map(i => ({
      type: `cassette ${i}`,
      schema: Yup.object().shape({
        [i]: Yup.number()
          .required()
          .min(0)
          .max(CASHBOX_DEFAULT_CAPACITY)
      })
    }))
  )

  const steps = R.prepend(
    {
      type: 'cashbox',
      schema: Yup.object().shape({
        wasCashboxEmptied: Yup.string().required()
      })
    },
    makeCassetteSteps(numberOfCassetteSteps + 1)
  )

  return (
    <Modal
      title={step === 0 ? null : title}
      handleClose={onClose}
      width={MODAL_WIDTH}
      height={MODAL_HEIGHT}
      open={true}>
      {step === 0 && (
        <WizardSplash name={machine?.name} onContinue={() => onContinue()} />
      )}
      {step !== 0 && (
        <WizardStep
          step={step}
          name={machine?.name}
          machine={machine}
          cashoutSettings={cashoutSettings}
          cassetteCapacity={CASHBOX_DEFAULT_CAPACITY}
          error={error}
          lastStep={isLastStep}
          steps={steps}
          fiatCurrency={locale.fiatCurrency}
          onContinue={onContinue}
        />
      )}
    </Modal>
  )
}

export default Wizard
