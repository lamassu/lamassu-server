import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { Formik, Form, Field } from 'formik'
import * as R from 'ramda'
import React from 'react'

import Stepper from 'src/components/Stepper'
import { Tooltip } from 'src/components/Tooltip'
import { Button } from 'src/components/buttons'
import { Cashbox } from 'src/components/inputs/cashbox/Cashbox'
import { NumberInput, RadioGroup } from 'src/components/inputs/formik'
import { Info2, H4, P, Info1 } from 'src/components/typography'
import cashbox from 'src/styling/icons/cassettes/acceptor-left.svg'
import cassetteOne from 'src/styling/icons/cassettes/dispenser-1.svg'
import cassetteTwo from 'src/styling/icons/cassettes/dispenser-2.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { comet } from 'src/styling/variables'

const styles = {
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
    paddingBottom: 32
  },
  titleDiv: {
    marginBottom: 32
  },
  title: {
    margin: [[0, 0, 12, 0]],
    color: comet
  },
  stepImage: {
    width: 148,
    height: 196
  },
  form: {
    paddingBottom: 95
  },
  verticalAlign: {
    display: 'flex',
    flexDirection: 'column'
  },
  horizontalAlign: {
    display: 'flex',
    flexDirection: 'row'
  },
  centerAlignment: {
    alignItems: 'center'
  },
  lineAlignment: {
    alignItems: 'baseline'
  },
  fullWidth: {
    margin: [[0, 'auto']],
    flexBasis: 'auto'
  },
  formWrapper: {
    flexBasis: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  submit: {
    float: 'right'
  },
  cashboxBills: {
    marginRight: 5
  },
  cassetteCashbox: {
    width: 40,
    height: 35
  },
  cassetteFormTitle: {
    marginTop: 18
  },
  cassetteFormTitleContent: {
    marginLeft: 10,
    marginRight: 25
  },
  smBottomMargin: {
    marginBottom: 25
  },
  fiatTotal: {
    color: comet
  }
}

const useStyles = makeStyles(styles)

const WizardStep = ({
  step,
  name,
  machine,
  cashoutSettings,
  cassetteCapacity,
  error,
  lastStep,
  steps,
  fiatCurrency,
  onContinue
}) => {
  const classes = useStyles()

  const label = lastStep ? 'Finish' : 'Confirm'

  const cassetesArtworks = {
    1: cashbox,
    2: cassetteOne,
    3: cassetteTwo
  }

  const stepOneRadioOptions = [
    { display: 'Yes', code: 'YES' },
    { display: 'No', code: 'NO' }
  ]

  const cassetteInfo = {
    amount: step === 2 ? machine?.cassette1 : machine?.cassette2,
    denomination: step === 2 ? cashoutSettings.top : cashoutSettings.bottom
  }

  const getPercentage = values =>
    R.clamp(
      0,
      100,
      (100 *
        (step === 2
          ? values.cassette1Count ?? cassetteInfo.amount
          : values.cassette2Count ?? cassetteInfo.amount)) /
        cassetteCapacity
    )

  return (
    <div className={classes.content}>
      <div className={classes.titleDiv}>
        <Info2 className={classes.title}>{name}</Info2>
        <Stepper steps={steps.length} currentStep={step} />
      </div>

      {step === 1 && (
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          onSubmit={onContinue}
          initialValues={{ wasCashboxEmptied: '' }}
          enableReinitialize
          validationSchema={steps[step - 1].schema}>
          {({ values }) => (
            <Form>
              <div
                className={classnames(classes.horizontalAlign, classes.form)}>
                <img
                  className={classes.stepImage}
                  alt="cassette"
                  src={cassetesArtworks[step]}></img>
                <div className={classes.formWrapper}>
                  <div
                    className={classnames(
                      classes.verticalAlign,
                      classes.fullWidth
                    )}>
                    <H4 noMargin>Did you empty the cash-in box?</H4>
                    <Field
                      component={RadioGroup}
                      name="wasCashboxEmptied"
                      options={stepOneRadioOptions}
                      className={classes.horizontalAlign}
                    />
                    <div
                      className={classnames(
                        classes.horizontalAlign,
                        classes.centerAlignment
                      )}>
                      <P>Since previous update</P>
                      <Tooltip>Insert tooltip text here.</Tooltip>
                    </div>
                    <div
                      className={classnames(
                        classes.horizontalAlign,
                        classes.lineAlignment
                      )}>
                      <Info1 noMargin className={classes.cashboxBills}>
                        {machine?.cashbox}
                      </Info1>
                      <P noMargin>accepted bills</P>
                    </div>
                    {steps[step - 1].fiatAmount && (
                      <P noMargin className={classes.fiatTotal}>
                        = {steps[step - 1].fiatAmount} {fiatCurrency}
                      </P>
                    )}
                  </div>
                </div>
              </div>
              <Button className={classes.submit} type="submit">
                {label}
              </Button>
            </Form>
          )}
        </Formik>
      )}

      {(step === 2 || step === 3) && (
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          onSubmit={onContinue}
          initialValues={{ cassette1Count: '', cassette2Count: '' }}
          enableReinitialize
          validationSchema={steps[step - 1].schema}>
          {({ values }) => (
            <Form>
              <div
                className={classnames(classes.horizontalAlign, classes.form)}>
                <img
                  className={classes.stepImage}
                  alt="cassette"
                  src={cassetesArtworks[step]}></img>
                <div className={classes.formWrapper}>
                  <div
                    className={classnames(
                      classes.verticalAlign,
                      classes.fullWidth
                    )}>
                    <div
                      className={classnames(
                        classes.horizontalAlign,
                        classes.smBottomMargin
                      )}>
                      <div
                        className={classnames(
                          classes.horizontalAlign,
                          classes.cassetteFormTitle
                        )}>
                        <TxOutIcon />
                        <H4
                          className={classes.cassetteFormTitleContent}
                          noMargin>
                          Cash-out {step - 1} (dispenser)
                        </H4>
                      </div>
                      <Cashbox
                        className={classes.cassetteCashbox}
                        percent={getPercentage(values)}
                        cashOut
                      />
                    </div>
                    <H4 noMargin>Refill bill count</H4>
                    <div
                      className={classnames(
                        classes.horizontalAlign,
                        classes.lineAlignment
                      )}>
                      <Field
                        component={NumberInput}
                        decimalPlaces={0}
                        width={50}
                        placeholder={cassetteInfo.amount.toString()}
                        name={`cassette${step - 1}Count`}
                        className={classes.cashboxBills}
                      />
                      <P>
                        {cassetteInfo.denomination} {fiatCurrency} bills loaded
                      </P>
                    </div>
                    <P noMargin className={classes.fiatTotal}>
                      ={' '}
                      {step === 2
                        ? (values.cassette1Count ?? 0) *
                          cassetteInfo.denomination
                        : (values.cassette2Count ?? 0) *
                          cassetteInfo.denomination}{' '}
                      {fiatCurrency}
                    </P>
                  </div>
                </div>
              </div>
              <Button className={classes.submit} type="submit">
                {label}
              </Button>
            </Form>
          )}
        </Formik>
      )}
    </div>
  )
}

export default WizardStep
