import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'
import { toNamespace } from 'src/utils/config'

import WizardSplash from './WizardSplash'
import WizardStep from './WizardStep'
import { DenominationsSchema } from './helper'

const LAST_STEP = 3
const MODAL_WIDTH = 554

const Wizard = ({ machine, onClose, save, error }) => {
  const [{ step, config }, setState] = useState({
    step: 0,
    config: { active: true }
  })

  const title = `Enable cash-out`
  const isLastStep = step === LAST_STEP

  const onContinue = async it => {
    if (isLastStep) {
      return save(
        toNamespace(machine.deviceId, DenominationsSchema.cast(config))
      )
    }

    const newConfig = R.merge(config, it)

    setState({
      step: step + 1,
      config: newConfig
    })
  }

  const getStepData = () => {
    switch (step) {
      case 1:
        return {
          type: 'top',
          display: 'Cassete 1 (Top)',
          schema: Yup.object().shape({ top: Yup.number().required() })
        }
      case 2:
        return {
          type: 'bottom',
          display: 'Cassete 2',
          schema: Yup.object().shape({ bottom: Yup.number().required() })
        }
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
        <WizardSplash name={machine.name} onContinue={() => onContinue()} />
      )}
      {step !== 0 && (
        <WizardStep
          step={step}
          name={machine.name}
          error={error}
          lastStep={isLastStep}
          {...getStepData()}
          onContinue={onContinue}
        />
      )}
    </Modal>
  )
}

export default Wizard
