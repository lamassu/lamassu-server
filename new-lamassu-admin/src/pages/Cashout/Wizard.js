import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import Modal from 'src/components/Modal'
import { Autocomplete } from 'src/components/inputs/formik'
import denominations from 'src/utils/bill-denominations'
import { getBillOptions } from 'src/utils/bill-options'
import { toNamespace } from 'src/utils/config'
import { transformNumber } from 'src/utils/number'

import WizardSplash from './WizardSplash'
import WizardStep from './WizardStep'
import { DenominationsSchema } from './helper'

const MODAL_WIDTH = 554
const MODAL_HEIGHT = 520

const Wizard = ({ machine, locale, onClose, save, error }) => {
  const LAST_STEP = machine.numberOfCassettes + machine.numberOfStackers + 1
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
        toNamespace(
          machine.deviceId,
          DenominationsSchema.cast(config, { assert: false })
        )
      )
    }

    const newConfig = R.merge(config, it)

    setState({
      step: step + 1,
      config: newConfig
    })
  }

  const steps = R.concat(
    R.map(
      it => ({
        type: `cassette${it}`,
        display: `Cassette ${it}`,
        component: Autocomplete,
        inputProps: {
          options: options,
          labelProp: 'display',
          valueProp: 'code'
        }
      }),
      R.range(1, machine.numberOfCassettes + 1)
    ),
    R.chain(
      it => [
        {
          type: `stacker${it}f`,
          display: `Stacker ${it}F`,
          component: Autocomplete,
          inputProps: {
            options: options,
            labelProp: 'display',
            valueProp: 'code'
          }
        },
        {
          type: `stacker${it}r`,
          display: `Stacker ${it}R`,
          component: Autocomplete,
          inputProps: {
            options: options,
            labelProp: 'display',
            valueProp: 'code'
          }
        }
      ],
      R.range(
        machine.numberOfCassettes + 1,
        machine.numberOfCassettes + machine.numberOfStackers + 1
      )
    )
  )

  const schema = () =>
    Yup.object().shape({
      cassette1: Yup.number().required(),
      cassette2:
        machine.numberOfCassettes > 1 && step >= 2
          ? Yup.number().required()
          : Yup.number()
              .transform(transformNumber)
              .nullable(),
      cassette3:
        machine.numberOfCassettes > 2 && step >= 3
          ? Yup.number().required()
          : Yup.number()
              .transform(transformNumber)
              .nullable(),
      cassette4:
        machine.numberOfCassettes > 3 && step >= 4
          ? Yup.number().required()
          : Yup.number()
              .transform(transformNumber)
              .nullable()
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
          numberOfCassettes={machine.numberOfCassettes}
          error={error}
          isLastStep={isLastStep}
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
