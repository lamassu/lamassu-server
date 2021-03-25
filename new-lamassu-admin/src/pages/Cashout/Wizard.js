import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'
import { Autocomplete } from 'src/components/inputs/formik'
import denominations from 'src/utils/bill-denominations'
import { getBillOptions } from 'src/utils/bill-options'
import { toNamespace } from 'src/utils/config'

import WizardSplash from './WizardSplash'
import WizardStep from './WizardStep'
import { DenominationsSchema } from './helper'

const LAST_STEP = 3
const MODAL_WIDTH = 554
const MODAL_HEIGHT = 520

const Wizard = ({ machine, locale, onClose, save, error }) => {
  const [{ step, config }, setState] = useState({
    step: 0,
    config: { active: true }
  })

  const options = getBillOptions(locale, denominations)

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

  const steps = [
    {
      type: 'top',
      display: 'Cassette 1 (Top)',
      component: Autocomplete,
      inputProps: {
        options: R.map(it => ({ code: it, display: it }))(options),
        labelProp: 'display',
        valueProp: 'code'
      }
    },
    {
      type: 'bottom',
      display: 'Cassette 2',
      component: Autocomplete,
      inputProps: {
        options: R.map(it => ({ code: it, display: it }))(options),
        labelProp: 'display',
        valueProp: 'code'
      }
    }
  ]

  const schema = () =>
    Yup.object().shape({
      top: Yup.number().required(),
      bottom: step >= 2 ? Yup.number().required() : Yup.number()
    })

  return (
    <Modal
      title={step === 0 ? null : title}
      handleClose={onClose}
      width={MODAL_WIDTH}
      height={MODAL_HEIGHT}
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
          steps={steps}
          fiatCurrency={locale.fiatCurrency}
          options={options}
          schema={schema()}
          onContinue={onContinue}
        />
      )}
    </Modal>
  )
}

export default Wizard
