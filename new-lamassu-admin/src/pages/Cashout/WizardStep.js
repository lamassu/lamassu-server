import { makeStyles } from '@material-ui/core'
import { Formik, Form, Field } from 'formik'
import React from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'
import { NumberInput } from 'src/components/inputs/formik'
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
    2: cassetteTwo,
    3: cassetteOne,
    4: cassetteTwo
  }

  return (
    <div className={classes.content}>
      <div className={classes.titleDiv}>
        <Info2 className={classes.title}>{name}</Info2>
        <Stepper steps={6} currentStep={step} />
      </div>

      {step <= 4 && (
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          onSubmit={onContinue}
          initialValues={{
            cassette1: '',
            cassette2: '',
            cassette3: '',
            cassette4: ''
          }}
          enableReinitialize
          validationSchema={schema}>
          <Form>
            <div className={classes.header}>
              {steps.map(
                ({ type, display, component }, idx) =>
                  1 + idx === step && (
                    <div key={idx} className={classes.step}>
                      <H4 className={classes.edit}>Edit {display}</H4>

                      <Label1>Choose bill denomination</Label1>
                      <div className={classes.bill}>
                        <Field
                          className={classes.billInput}
                          type="text"
                          size="lg"
                          autoFocus={1 + idx === step}
                          component={
                            options?.length > 0 ? component : NumberInput
                          }
                          fullWidth
                          decimalPlaces={0}
                          name={type}
                          options={options}
                          valueProp={'code'}
                          labelProp={'display'}></Field>
                        <Info1 noMargin className={classes.suffix}>
                          {fiatCurrency}
                        </Info1>
                      </div>
                    </div>
                  )
              )}
              <img
                className={classes.stepImage}
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

      {step === 5 && (
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          onSubmit={onContinue}
          initialValues={{ zeroConfLimit: '' }}
          enableReinitialize
          validationSchema={steps[step - 1].schema}>
          <Form>
            <div className={classes.thirdStepHeader}>
              <div className={classes.step}>
                <H4 className={classes.edit}>Edit 0-conf Limit</H4>

                <Label1>Choose a limit</Label1>
                <div className={classes.bill}>
                  <Field
                    className={classes.billInput}
                    type="text"
                    size="lg"
                    autoFocus={true}
                    component={NumberInput}
                    fullWidth
                    decimalPlaces={0}
                    name={steps[step - 1].type}
                  />
                  <Info1 noMargin className={classes.suffix}>
                    {fiatCurrency}
                  </Info1>
                </div>
              </div>
            </div>

            <Button className={classes.submit} type="submit">
              {label}
            </Button>
          </Form>
        </Formik>
      )}

      {lastStep && (
        <div className={classes.disclaimer}>
          <Info2 className={classes.title}>Cash-out Bill Count</Info2>
          <P>
            <WarningIcon className={classes.disclaimerIcon} />
            When enabling cash-out, your bill count will be automatically set to
            zero. Make sure you physically put cash inside the cash cassettes to
            allow the machine to dispense it to your users. If you already did,
            make sure you set the correct cash-out bill count for this machine
            on your Cash Cassettes tab under Maintenance.
          </P>

          <Info2 className={classes.title}>Default Commissions</Info2>
          <P>
            <WarningIcon className={classes.disclaimerIcon} />
            When enabling cash-out, default commissions will be set. To change
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
