import { useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'

import WizardSplash from './WizardSplash'
import WizardStep from './WizardStep'

const MODAL_WIDTH = 554
const MODAL_HEIGHT = 520
const CASHBOX_DEFAULT_CAPACITY = 500

const CREATE_BATCH = gql`
  mutation createBatch($deviceId: ID, $cashboxCount: Int) {
    createBatch(deviceId: $deviceId, cashboxCount: $cashboxCount) {
      id
    }
  }
`

const Wizard = ({ machine, cashoutSettings, locale, onClose, save, error }) => {
  const [{ step, config }, setState] = useState({
    step: 0,
    config: { active: true }
  })

  const [createBatch] = useMutation(CREATE_BATCH)

  const isCashOutDisabled =
    R.isEmpty(cashoutSettings) || !cashoutSettings?.active

  const numberOfCassettes = isCashOutDisabled ? 0 : machine.numberOfCassettes

  const LAST_STEP = numberOfCassettes + 1

  const title = `Update counts`
  const isLastStep = step === LAST_STEP

  const onContinue = it => {
    const newConfig = R.merge(config, it)

    if (isLastStep) {
      const wasCashboxEmptied = [
        config?.wasCashboxEmptied,
        it?.wasCashboxEmptied
      ].includes('YES')

      const cashbox = wasCashboxEmptied ? 0 : machine?.cashbox

      if (wasCashboxEmptied) {
        createBatch({
          variables: {
            deviceId: machine.id,
            cashboxCount: machine.cashbox
          }
        })
      }

      const { cassette1, cassette2, cassette3, cassette4 } = R.map(parseInt, it)
      save(machine.id, cashbox, cassette1, cassette2, cassette3, cassette4)
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
          .max(CASHBOX_DEFAULT_CAPACITY)
      })
    }))
  )

  const steps = R.prepend(
    {
      type: 'cashbox',
      schema: Yup.object().shape({
        wasCashboxEmptied: Yup.string().required('Select one option.')
      }),
      cashoutRequired: false
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
        />
      )}
    </Modal>
  )
}

export default Wizard
