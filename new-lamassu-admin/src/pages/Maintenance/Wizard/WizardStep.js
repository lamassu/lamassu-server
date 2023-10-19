import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { Formik, Form, Field } from 'formik'
import * as R from 'ramda'
import React from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Stepper from 'src/components/Stepper'
import { HoverableTooltip } from 'src/components/Tooltip'
import { Button } from 'src/components/buttons'
import { Cashbox } from 'src/components/inputs/cashbox/Cashbox'
import { NumberInput, RadioGroup } from 'src/components/inputs/formik'
import { Info2, H4, P, Info1 } from 'src/components/typography'
import cashbox from 'src/styling/icons/cassettes/acceptor-left.svg'
import cassetteOne from 'src/styling/icons/cassettes/dispenser-1.svg'
import cassetteTwo from 'src/styling/icons/cassettes/dispenser-2.svg'
import tejo3CassetteOne from 'src/styling/icons/cassettes/tejo/3-cassettes/3-cassettes-open-1-left.svg'
import tejo3CassetteTwo from 'src/styling/icons/cassettes/tejo/3-cassettes/3-cassettes-open-2-left.svg'
import tejo3CassetteThree from 'src/styling/icons/cassettes/tejo/3-cassettes/3-cassettes-open-3-left.svg'
import tejo4CassetteOne from 'src/styling/icons/cassettes/tejo/4-cassettes/4-cassettes-open-1-left.svg'
import tejo4CassetteTwo from 'src/styling/icons/cassettes/tejo/4-cassettes/4-cassettes-open-2-left.svg'
import tejo4CassetteThree from 'src/styling/icons/cassettes/tejo/4-cassettes/4-cassettes-open-3-left.svg'
import tejo4CassetteFour from 'src/styling/icons/cassettes/tejo/4-cassettes/4-cassettes-open-4-left.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { comet, errorColor } from 'src/styling/variables'
import { getCashUnitCapacity } from 'src/utils/machine'
import { numberToFiatAmount } from 'src/utils/number'
import { startCase } from 'src/utils/string'

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
  },
  errorMessage: {
    color: errorColor
  },
  stepErrorMessage: {
    maxWidth: 275,
    marginTop: 25
  }
}

const useStyles = makeStyles(styles)

const CASHBOX_STEP = 1

const isCashboxStep = step => step === CASHBOX_STEP
const isCassetteStep = (step, numberOfCassettes) =>
  step > 1 && step <= numberOfCassettes + 1
const isRecyclerStep = (step, numberOfCassettes, numberOfRecyclers) =>
  step > numberOfCassettes + 1 &&
  step <= numberOfCassettes + numberOfRecyclers + 1

const cassetesArtworks = (step, numberOfCassettes, numberOfRecyclers) => {
  const cassetteStepsStart = CASHBOX_STEP + 1
  return isCassetteStep(step, numberOfCassettes)
    ? [
        [cassetteOne],
        [cassetteOne, cassetteTwo],
        [tejo3CassetteOne, tejo3CassetteTwo, tejo3CassetteThree],
        [
          tejo4CassetteOne,
          tejo4CassetteTwo,
          tejo4CassetteThree,
          tejo4CassetteFour
        ]
      ][numberOfCassettes - 1][step - cassetteStepsStart]
    : [
        /* TODO: Recycler artwork */
        [cassetteOne],
        [cassetteOne, cassetteTwo],
        [tejo3CassetteOne, tejo3CassetteTwo, tejo3CassetteThree],
        [
          tejo4CassetteOne,
          tejo4CassetteTwo,
          tejo4CassetteThree,
          tejo4CassetteFour
        ]
      ][numberOfRecyclers - 1][step - cassetteStepsStart]
}

const getCashUnitFieldName = (step, numberOfCassettes, numberOfRecyclers) => {
  if (isCashboxStep(step)) return { name: 'cashbox', category: 'cashbox' }
  const cassetteStepsStart = CASHBOX_STEP + 1
  if (isCassetteStep(step, numberOfCassettes))
    return {
      name: `cassette${step - cassetteStepsStart + 1}`,
      category: 'cassette'
    }
  const recyclerStepsStart = CASHBOX_STEP + numberOfCassettes + 1
  if (isRecyclerStep(step, numberOfCassettes, numberOfRecyclers))
    return {
      name: `recycler${Math.ceil(step - recyclerStepsStart + 1)}`,
      category: 'recycler'
    }
}

const WizardStep = ({
  step,
  name,
  machine,
  cashoutSettings,
  error,
  lastStep,
  steps,
  fiatCurrency,
  onContinue,
  initialValues
}) => {
  const classes = useStyles()

  const label = lastStep ? 'Finish' : 'Confirm'

  const stepOneRadioOptions = [
    { display: 'Yes', code: 'YES' },
    { display: 'No', code: 'NO' }
  ]

  const numberOfCassettes = machine.numberOfCassettes
  const numberOfRecyclers = machine.numberOfRecyclers
  const {
    name: cashUnitField,
    category: cashUnitCategory
  } = getCashUnitFieldName(step, numberOfCassettes, numberOfRecyclers)
  const originalCashUnitCount = machine?.cashUnits?.[cashUnitField]
  const cashUnitDenomination = cashoutSettings?.[cashUnitField]

  const cassetteCount = values => values[cashUnitField] || originalCashUnitCount
  const cassetteTotal = values => cassetteCount(values) * cashUnitDenomination
  const getPercentage = R.pipe(
    cassetteCount,
    count =>
      100 * (count / getCashUnitCapacity(machine.model, cashUnitCategory)),
    R.clamp(0, 100)
  )

  return (
    <div className={classes.content}>
      <div className={classes.titleDiv}>
        <Info2 className={classes.title}>{name}</Info2>
        <Stepper steps={steps.length} currentStep={step} />
      </div>

      {isCashboxStep(step) && (
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          onSubmit={onContinue}
          initialValues={{ wasCashboxEmptied: '' }}
          enableReinitialize
          validationSchema={steps[0].schema}>
          {({ errors }) => (
            <Form>
              <div
                className={classnames(classes.horizontalAlign, classes.form)}>
                <img
                  className={classes.stepImage}
                  alt={cashUnitCategory}
                  src={cashbox}></img>
                <div className={classes.formWrapper}>
                  <div
                    className={classnames(
                      classes.verticalAlign,
                      classes.fullWidth
                    )}>
                    <H4 noMargin>Did you empty the cash box?</H4>
                    <Field
                      component={RadioGroup}
                      name="wasCashboxEmptied"
                      options={stepOneRadioOptions}
                      className={classes.horizontalAlign}
                    />
                    {errors.wasCashboxEmptied && (
                      <div className={classes.errorMessage}>
                        {errors.wasCashboxEmptied}
                      </div>
                    )}
                    <div
                      className={classnames(
                        classes.horizontalAlign,
                        classes.centerAlignment
                      )}>
                      <P>Since previous update</P>
                      <HoverableTooltip width={215}>
                        <P>
                          Number of bills inside the cash box, since the last
                          cash box changes.
                        </P>
                      </HoverableTooltip>
                    </div>
                    <div
                      className={classnames(
                        classes.horizontalAlign,
                        classes.lineAlignment
                      )}>
                      <Info1 noMargin className={classes.cashboxBills}>
                        {machine?.cashUnits.cashbox}
                      </Info1>
                      <P noMargin>accepted bills</P>
                    </div>
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

      {!isCashboxStep(step) && (
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          onSubmit={onContinue}
          initialValues={initialValues}
          enableReinitialize
          validationSchema={steps[step - 1].schema}>
          {({ values, errors }) => (
            <Form>
              <div
                className={classnames(classes.horizontalAlign, classes.form)}>
                <img
                  className={classes.stepImage}
                  alt={cashUnitCategory}
                  src={cassetesArtworks(
                    step,
                    numberOfCassettes,
                    numberOfRecyclers
                  )}></img>
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
                          {startCase(cashUnitField)} (
                          {cashUnitCategory === 'cassette'
                            ? `dispenser`
                            : cashUnitCategory === 'recycler'
                            ? `recycler`
                            : ``}
                          )
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
                        placeholder={originalCashUnitCount.toString()}
                        name={cashUnitField}
                        className={classes.cashboxBills}
                        autoFocus
                      />
                      <P>
                        {cashUnitDenomination} {fiatCurrency} bills loaded
                      </P>
                    </div>
                    <P noMargin className={classes.fiatTotal}>
                      = {numberToFiatAmount(cassetteTotal(values))}{' '}
                      {fiatCurrency}
                    </P>
                    {!R.isEmpty(errors) && (
                      <ErrorMessage className={classes.stepErrorMessage}>
                        {R.head(R.values(errors))}
                      </ErrorMessage>
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
    </div>
  )
}

export default WizardStep
