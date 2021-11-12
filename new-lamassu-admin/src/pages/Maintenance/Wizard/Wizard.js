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

  const LAST_STEP = isCashOutDisabled ? 1 : 3

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

      save(
        machine.id,
        parseInt(cashbox),
        parseInt(it.cassette1Count ?? 0),
        parseInt(it.cassette2Count ?? 0)
      )
      return onClose()
    }

    setState({
      step: step + 1,
      config: newConfig
    })
  }

  const steps = [
    {
      type: 'cashbox',
      schema: Yup.object().shape({
        wasCashboxEmptied: Yup.string().required('Select one option.')
      }),
      cashoutRequired: false
    },
    {
      type: 'cassette 1',
      schema: Yup.object().shape({
        cassette1Count: Yup.number()
          .label('Bill count')
          .required()
          .min(0)
          .max(CASHBOX_DEFAULT_CAPACITY)
      }),
      cashoutRequired: true
    },
    {
      type: 'cassette 2',
      schema: Yup.object().shape({
        cassette2Count: Yup.number()
          .label('Bill count')
          .required()
          .min(0)
          .max(CASHBOX_DEFAULT_CAPACITY)
      }),
      cashoutRequired: true
    }
  ]

  const filteredSteps = R.filter(it => {
    return !it.cashoutRequired || (!isCashOutDisabled && it.cashoutRequired)
  }, steps)

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
          steps={filteredSteps}
          fiatCurrency={locale.fiatCurrency}
          onContinue={onContinue}
        />
      )}
    </Modal>
  )
}

export default Wizard
