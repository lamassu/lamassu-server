import { makeStyles } from '@material-ui/core'
import { Formik, Form, Field } from 'formik'
import * as R from 'ramda'
import React from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import { Info2, H4, P, Info1, Label1 } from 'src/components/typography'
import cassetteOne from 'src/styling/icons/cassettes/cashout-cassette-1.svg'
import cassetteTwo from 'src/styling/icons/cassettes/cashout-cassette-2.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'

import styles from './WizardStep.styles'
const useStyles = makeStyles(styles)

const WizardStep = ({
  name,
  step,
  schema,
  error,
  lastStep,
  onContinue,
  steps,
  fiatCurrency,
  options
}) => {
  const classes = useStyles()

  const label = lastStep ? 'Finish' : 'Next'

  const cassetesArtworks = {
    1: cassetteOne,
    2: cassetteTwo
  }

  return (
    <div className={classes.content}>
      <div className={classes.titleDiv}>
        <Info2 className={classes.title}>{name}</Info2>
        <Stepper steps={3} currentStep={step} />
      </div>

      {!lastStep && (
        <Formik
          onSubmit={onContinue}
          initialValues={{ top: '', bottom: '' }}
          enableReinitialize
          validationSchema={schema}>
          <Form>
            <div className={classes.header}>
              {steps.map(
                ({ type, display, component }, idx) =>
                  1 + idx === step && (
                    <div key={idx}>
                      <H4 className={classes.edit}>Edit {display}</H4>

                      <Label1>Choose bill denomination</Label1>
                      <div className={classes.bill}>
                        <Field
                          type="text"
                          size="lg"
                          autoFocus={1 + idx === step}
                          component={
                            options?.length > 0 ? component : TextInput
                          }
                          fullWidth
                          name={type}
                          options={options}
                          valueProp={'code'}
                          getLabel={R.path(['display'])}></Field>
                        <Info1 noMargin className={classes.suffix}>
                          {fiatCurrency}
                        </Info1>
                      </div>
                    </div>
                  )
              )}
              <img
                alt="cassette"
                width="148"
                height="196"
                src={cassetesArtworks[step]}></img>
            </div>

            <Button className={classes.submit} type="submit">
              {label}
            </Button>
          </Form>
        </Formik>
      )}

      {lastStep && (
        <div className={classes.disclaimer}>
          <Info2 className={classes.title}>Cashout Bill Count</Info2>
          <P>
            <WarningIcon />
            When enabling cash out, your bill count will be automatically set to
            zero. Make sure you physically put cash inside the cashboxes to
            allow the machine to dispense it to your users. If you already did,
            make sure you set the correct cash out bill count for this machine
            on your Cashboxes tab under Maintenance.
          </P>

          <Info2 className={classes.title}>Default Commissions</Info2>
          <P>
            <WarningIcon />
            When enabling cash out, default commissions will be set. To change
            commissions for this machine, please go to the Commissions tab under
            Settings where you can set exceptions for each of the available
            cryptocurrencies.
          </P>
          <div>
            {error && <ErrorMessage>Failed to save</ErrorMessage>}
            <Button className={classes.submit} onClick={() => onContinue()}>
              {label}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WizardStep
