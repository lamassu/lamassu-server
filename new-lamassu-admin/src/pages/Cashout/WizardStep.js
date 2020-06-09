import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { Formik, Form, Field } from 'formik'
import React from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import { Info2, H4, P } from 'src/components/typography'

import styles from './WizardStep.styles'
const useStyles = makeStyles(styles)

const WizardStep = ({
  type,
  name,
  step,
  schema,
  error,
  lastStep,
  onContinue,
  display
}) => {
  const classes = useStyles()

  const label = lastStep ? 'Finish' : 'Next'
  const subtitleClass = {
    [classes.subtitle]: true,
    [classes.error]: error
  }

  return (
    <>
      <Info2 className={classes.title}>{name}</Info2>
      <Stepper steps={3} currentStep={step} />
      {display && <H4 className={classnames(subtitleClass)}>Edit {display}</H4>}

      {!lastStep && (
        <Formik
          onSubmit={onContinue}
          initialValues={{ [type]: '' }}
          enableReinitialize
          validationSchema={schema}>
          <Form>
            <Field
              name={type}
              component={TextInput}
              label={'Choose bill denomination'}
              autoFocus
              InputLabelProps={{ shrink: true }}
            />
            <div className={classes.submit}>
              <Button className={classes.button} type="submit">
                {label}
              </Button>
            </div>
          </Form>
        </Formik>
        // TODO: there was a disabled link here showing the currency code; restore it
      )}

      {lastStep && (
        <>
          <P>
            When enabling cash out, your bill count will be authomatically set
            to zero. Make sure you physically put cash inside the cashboxes to
            allow the machine to dispense it to your users. If you already did,
            make sure you set the correct cash out bill count for this machine
            on your Cashboxes tab under Maintenance.
          </P>
          <P>
            When enabling cash out, default commissions will be set. To change
            commissions for this machine, please go to the Commissions tab under
            Settings. where you can set exceptions for each of the available
            cryptocurrencies.
          </P>
          <div className={classes.submit}>
            {error && <ErrorMessage>Failed to save</ErrorMessage>}
            <Button className={classes.button} onClick={() => onContinue()}>
              {label}
            </Button>
          </div>
        </>
      )}
    </>
  )
}

export default WizardStep
