import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'
import { MAX_NUMBER_OF_CASSETTES } from 'src/utils/constants'
import { cashUnitCapacity, modelPrettifier } from 'src/utils/machine'
import { defaultToZero } from 'src/utils/number'

import WizardSplash from './WizardSplash'
import WizardStep from './WizardStep'

const MODAL_WIDTH = 554
const MODAL_HEIGHT = 535

const CASSETTE_FIELDS = R.map(
  it => `cassette${it}`,
  R.range(1, MAX_NUMBER_OF_CASSETTES + 1)
)

const STACKER_FIELDS = [
  'stacker1f',
  'stacker1r',
  'stacker2f',
  'stacker2r',
  'stacker3f',
  'stacker3r'
]

const Wizard = ({ machine, cashoutSettings, locale, onClose, save, error }) => {
  const [{ step, config }, setState] = useState({
    step: 0,
    config: { active: true }
  })

  const isCashOutDisabled =
    R.isEmpty(cashoutSettings) || !cashoutSettings?.active

  const numberOfCassettes = isCashOutDisabled ? 0 : machine.numberOfCassettes
  const numberOfStackers = machine.numberOfStackers

  const LAST_STEP = numberOfCassettes + numberOfStackers * 2 + 1

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

  const buildStackerObj = cassetteInput => {
    return R.reduce(
      (acc, value) => {
        acc[value] = defaultToZero(cassetteInput[value])
        return acc
      },
      {},
      STACKER_FIELDS
    )
  }

  const onContinue = it => {
    const newConfig = R.merge(config, it)
    if (isLastStep) {
      const wasCashboxEmptied = [
        config?.wasCashboxEmptied,
        it?.wasCashboxEmptied
      ].includes('YES')

      const cassettes = buildCassetteObj(it)
      const stackers = buildStackerObj(it)

      const cashUnits = {
        cashbox: wasCashboxEmptied ? 0 : machine?.cashUnits.cashbox,
        ...cassettes,
        ...stackers
      }

      save(machine.id, cashUnits)
      return onClose()
    }

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
          .label('Bill count')
          .positive()
          .integer()
          .required()
          .min(0)
          .max(
            cashUnitCapacity[machine.model].cassette,
            `${modelPrettifier[machine.model]} maximum cassette capacity is ${
              cashUnitCapacity[machine.model].cassette
            } bills`
          )
      })
    }))
  )

  const makeStackerSteps = R.pipe(
    R.add(1),
    R.range(1),
    R.chain(i => [
      {
        type: `stacker ${i}f`,
        schema: Yup.object().shape({
          [`stacker${i}f`]: Yup.number()
            .label('Bill count')
            .positive()
            .integer()
            .required()
            .min(0)
            .max(
              cashUnitCapacity[machine.model].stacker,
              `${modelPrettifier[machine.model]} maximum stacker capacity is ${
                cashUnitCapacity[machine.model].stacker
              } bills`
            )
        })
      },
      {
        type: `stacker ${i}r`,
        schema: Yup.object().shape({
          [`stacker${i}r`]: Yup.number()
            .label('Bill count')
            .positive()
            .integer()
            .required()
            .min(0)
            .max(
              cashUnitCapacity[machine.model].stacker,
              `${modelPrettifier[machine.model]} maximum stacker capacity is ${
                cashUnitCapacity[machine.model].stacker
              } bills`
            )
        })
      }
    ])
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

  const steps = R.pipe(
    R.concat(makeStackerSteps(numberOfStackers)),
    R.concat(makeCassetteSteps(numberOfCassettes)),
    R.concat([
      {
        type: 'cashbox',
        schema: Yup.object().shape({
          wasCashboxEmptied: Yup.string().required('Select one option.')
        }),
        cashoutRequired: false
      }
    ])
  )([])

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
