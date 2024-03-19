import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'
import { MAX_NUMBER_OF_CASSETTES } from 'src/utils/constants'
import {
  cashUnitCapacity,
  getCashUnitCapacity,
  modelPrettifier
} from 'src/utils/machine'
import { defaultToZero } from 'src/utils/number'

import WizardSplash from './WizardSplash'
import WizardStep from './WizardStep'

const MODAL_WIDTH = 554
const MODAL_HEIGHT = 535

const CASSETTE_FIELDS = R.map(
  it => `cassette${it}`,
  R.range(1, MAX_NUMBER_OF_CASSETTES + 1)
)

const RECYCLER_FIELDS = [
  'recycler1',
  'recycler2',
  'recycler3',
  'recycler4',
  'recycler5',
  'recycler6'
]

const canManuallyLoadRecyclers = ({ model }) => ['grandola'].includes(model)

const Wizard = ({ machine, cashoutSettings, locale, onClose, save, error }) => {
  const [{ step, config }, setState] = useState({
    step: 0,
    config: { active: true }
  })

  const isCashOutDisabled =
    R.isEmpty(cashoutSettings) || !cashoutSettings?.active

  const numberOfCassettes = isCashOutDisabled ? 0 : machine.numberOfCassettes
  const numberOfRecyclers = machine.numberOfRecyclers

  const LAST_STEP = canManuallyLoadRecyclers(machine)
    ? numberOfCassettes + numberOfRecyclers + 1
    : numberOfCassettes + 1

  const title = `Update counts`
  const isLastStep = step === LAST_STEP

  const buildCashUnitObj = (fields, cassetteInput) =>
    R.pipe(R.pickAll(fields), R.map(defaultToZero))(cassetteInput)

  const onContinue = it => {
    const newConfig = R.merge(config, it)
    if (isLastStep) {
      const wasCashboxEmptied = [
        config?.wasCashboxEmptied,
        it?.wasCashboxEmptied
      ].includes('YES')

      const cassettes = buildCashUnitObj(CASSETTE_FIELDS, it)
      const recyclers = canManuallyLoadRecyclers(machine)
        ? buildCashUnitObj(RECYCLER_FIELDS, it)
        : []

      const cashUnits = {
        cashbox: wasCashboxEmptied ? 0 : machine?.cashUnits.cashbox,
        ...cassettes,
        ...recyclers
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
            getCashUnitCapacity(machine.model, 'cassette'),
            `${
              modelPrettifier[machine.model]
            } maximum cassette capacity is ${getCashUnitCapacity(
              machine.model,
              'cassette'
            )} bills`
          )
      })
    }))
  )

  const makeRecyclerSteps = R.pipe(
    R.add(1),
    R.range(1),
    R.chain(i => ({
      type: `recycler ${i}`,
      schema: Yup.object().shape({
        [`recycler${i}`]: Yup.number()
          .label('Bill count')
          .positive()
          .integer()
          .required()
          .min(0)
          .max(
            cashUnitCapacity[machine.model].recycler,
            `${modelPrettifier[machine.model]}
              maximum recycler capacity is ${
                cashUnitCapacity[machine.model].recycler
              } bills`
          )
      })
    }))
  )

  const makeCassettesInitialValues = () =>
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

  const makeRecyclersInitialValues = () =>
    !R.isEmpty(cashoutSettings)
      ? R.reduce(
          (acc, value) => {
            acc[`recycler${value * 2 - 1}`] = ''
            acc[`recycler${value * 2}`] = ''
            return acc
          },
          {},
          R.range(1, numberOfRecyclers + 1)
        )
      : {}

  const makeInitialValues = () =>
    R.merge(makeCassettesInitialValues(), makeRecyclersInitialValues())

  const steps = R.pipe(
    R.concat(
      makeRecyclerSteps(
        canManuallyLoadRecyclers(machine) ? numberOfRecyclers : 0
      )
    ),
    R.concat(makeCassetteSteps(isCashOutDisabled ? 0 : numberOfCassettes)),
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
