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
import tejo3CassetteOne from 'src/styling/icons/cassettes/tejo/3-cassettes/3-cassettes-open-1-left.svg'
import tejo3CassetteTwo from 'src/styling/icons/cassettes/tejo/3-cassettes/3-cassettes-open-2-left.svg'
import tejo3CassetteThree from 'src/styling/icons/cassettes/tejo/3-cassettes/3-cassettes-open-3-left.svg'
import tejo4CassetteOne from 'src/styling/icons/cassettes/tejo/4-cassettes/4-cassettes-open-1-left.svg'
import tejo4CassetteTwo from 'src/styling/icons/cassettes/tejo/4-cassettes/4-cassettes-open-2-left.svg'
import tejo4CassetteThree from 'src/styling/icons/cassettes/tejo/4-cassettes/4-cassettes-open-3-left.svg'
import tejo4CassetteFour from 'src/styling/icons/cassettes/tejo/4-cassettes/4-cassettes-open-4-left.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'

import styles from './WizardStep.styles'
const useStyles = makeStyles(styles)

const getCassetesArtworks = () => ({
  1: {
    1: cassetteOne
  },
  2: {
    1: cassetteOne,
    2: cassetteTwo
  },
  3: {
    1: tejo3CassetteOne,
    2: tejo3CassetteTwo,
    3: tejo3CassetteThree
  },
  4: {
    1: tejo4CassetteOne,
    2: tejo4CassetteTwo,
    3: tejo4CassetteThree,
    4: tejo4CassetteFour
  }
})

const WizardStep = ({
  name,
  step,
  schema,
  error,
  isLastStep,
  onContinue,
  steps,
  fiatCurrency,
  options,
  numberOfCassettes
}) => {
  const classes = useStyles()

  const label = isLastStep ? 'Finish' : 'Next'
  const cassetteIcon = getCassetesArtworks()[numberOfCassettes]
  return (
    <>
      <div className={classes.titleDiv}>
        <Info2 className={classes.title}>{name}</Info2>
        <Stepper steps={steps.length + 1} currentStep={step} />
      </div>

      {!isLastStep && (
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
          <Form className={classes.column}>
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
                height="205"
                src={cassetteIcon ? cassetteIcon[step] : null}></img>
            </div>

            <Button className={classes.submit} type="submit">
              {label}
            </Button>
          </Form>
        </Formik>
      )}

      {isLastStep && (
        <div className={classes.column}>
          <div>
            <Info2 className={classes.title}>Cash Cassette Bill Count</Info2>
            <P>
              <WarningIcon className={classes.disclaimerIcon} />
              When enabling cash-out, your bill count will be automatically set
              to zero. Make sure you physically put cash inside the cash
              cassettes to allow the machine to dispense it to your users. If
              you already did, make sure you set the correct cash cassette bill
              count for this machine on your Cash Boxes & Cassettes tab under
              Maintenance.
            </P>
            <Info2 className={classes.title}>Default Commissions</Info2>
            <P>
              <WarningIcon className={classes.disclaimerIcon} />
              When enabling cash-out, default commissions will be set. To change
              commissions for this machine, please go to the Commissions tab
              under Settings where you can set exceptions for each of the
              available cryptocurrencies.
            </P>
          </div>
          {error && <ErrorMessage>Failed to save</ErrorMessage>}
          <Button className={classes.submit} onClick={() => onContinue()}>
            {label}
          </Button>
        </div>
      )}
    </>
  )
}

export default WizardStep
