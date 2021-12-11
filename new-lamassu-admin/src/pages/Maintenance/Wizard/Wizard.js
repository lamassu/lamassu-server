import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'
import { defaultToZero } from 'src/utils/number.js'

import WizardSplash from './WizardSplash'
import WizardStep from './WizardStep'

const MODAL_WIDTH = 554
const MODAL_HEIGHT = 520
const CASHBOX_DEFAULT_CAPACITY = 500

// Maximum number of cassettes, to create the necessary fields for the back-end
const MAX_NUMBER_OF_CASSETTES = 4

const CASSETTE_FIELDS = R.map(
  it => `cassette${it}`,
  R.range(1, MAX_NUMBER_OF_CASSETTES + 1)
)

const Wizard = ({ machine, cashoutSettings, locale, onClose, save, error }) => {
  const [{ step, config }, setState] = useState({
    step: 0,
    config: { active: true }
  })

  const numberOfCassettes = R.isEmpty(cashoutSettings)
    ? 0
    : machine.numberOfCassettes
  const LAST_STEP = numberOfCassettes + 1

  const title = `Update counts`
  const isLastStep = step === LAST_STEP

  const buildCassetteObj = cassetteInput => {
    return R.reduce(
      (acc, value) => {
        acc[value] = defaultToZero(cassetteInput[value])
        return acc
      },
      {},
      CASSETTE_FIELDS
    )
  }

  const onContinue = it => {
    if (isLastStep) {
      const wasCashboxEmptied = [
        config?.wasCashboxEmptied,
        it?.wasCashboxEmptied
      ].includes('YES')

      const cashbox = wasCashboxEmptied ? 0 : machine?.cashbox
      const cassettes = buildCassetteObj(it)

      save(machine.id, cashbox, cassettes)
      return onClose()
    }

    const newConfig = R.merge(config, it)
    setState({
      step: step + 1,
      config: newConfig
    })
  }

  const makeCassetteSteps = R.pipe(
    R.add(1),
    R.range(1),
    R.map(i => ({
      type: `cassette ${i}`,
      schema: Yup.object().shape({
        [`cassette${i}`]: Yup.number()
          .positive()
          .integer()
          .required()
          .min(0)
          .max(CASHBOX_DEFAULT_CAPACITY)
      })
    }))
  )

  const makeInitialValues = () =>
    !R.isEmpty(cashoutSettings)
      ? R.reduce(
          (acc, value) => {
            acc[`cassette${value}`] = ''
            return acc
          },
          {},
          R.range(1, numberOfCassettes + 1)
        )
      : {}

  const steps = R.prepend(
    {
      type: 'cashbox',
      schema: Yup.object().shape({
        wasCashboxEmptied: Yup.string().required()
      })
    },
    makeCassetteSteps(numberOfCassettes)
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
          initialValues={makeInitialValues()}
        />
      )}
    </Modal>
  )
}

export default Wizard
