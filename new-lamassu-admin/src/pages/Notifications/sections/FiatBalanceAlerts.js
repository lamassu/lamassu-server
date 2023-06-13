import { makeStyles } from '@material-ui/core'
import { Form, Formik } from 'formik'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import PromptWhenDirty from 'src/components/PromptWhenDirty'
import { TL2 } from 'src/components/typography'
import { transformNumber } from 'src/utils/number'

import { Cashbox } from '../../../components/inputs/cashbox/Cashbox'
import Header from '../components/EditHeader'
import EditableNumber from '../components/EditableNumber'

import styles from './FiatBalanceAlerts.styles.js'

const useStyles = makeStyles(styles)

const CASH_IN_KEY = 'cash-in'
const LOAD_BOXES_KEY = 'load-boxes'
const CASSETTES_RECYCLERS_KEY = 'cassettes-recyclers'
const DEFAULT_NUMBER_OF_CASSETTES = 2
const DEFAULT_NUMBER_OF_STACKERS = 0
const notesMin = 0
const notesMax = 9999999

const FiatBalance = ({
  min = 0,
  max = 100,
  fieldWidth = 80,
  data,
  save,
  error,
  editing,
  setEditing
}) => {
  const { machines, notificationSettings } = data
  console.log(notificationSettings)
  const classes = useStyles()

  const maxNumberOfCassettes = Math.max(
    ...R.map(it => it.numberOfCassettes, machines),
    DEFAULT_NUMBER_OF_CASSETTES
  )

  const maxNumberOfStackers = Math.max(
    ...R.map(it => it.numberOfStackers, machines),
    DEFAULT_NUMBER_OF_STACKERS
  )

  const schema = Yup.object().shape({
    cashInAlertThreshold: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(notesMin)
      .max(notesMax)
      .nullable(),
    fillingPercentageCassette1: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable(),
    fillingPercentageCassette2: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable(),
    fiatBalanceCassette3: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable(),
    fiatBalanceCassette4: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable()
  })

  return (
    <Formik
      validateOnBlur={false}
      validateOnChange={false}
      enableReinitialize
      initialValues={{
        cashInAlertThreshold: data?.cashInAlertThreshold ?? '',
        fillingPercentageCassette1: data?.fillingPercentageCassette1 ?? '',
        fillingPercentageCassette2: data?.fillingPercentageCassette2 ?? '',
        fillingPercentageCassette3: data?.fillingPercentageCassette3 ?? '',
        fillingPercentageCassette4: data?.fillingPercentageCassette4 ?? ''
      }}
      validationSchema={schema}
      onSubmit={it => save(schema.cast(it))}
      onReset={() => setEditing(null)}>
      {({ values }) => (
        <>
          <Form className={classes.form}>
            <PromptWhenDirty />
            <Header
              title="Cash box"
              editing={editing === CASH_IN_KEY}
              disabled={editing !== CASH_IN_KEY}
              setEditing={() => setEditing(CASH_IN_KEY)}
            />
            <div className={classes.wrapper}>
              <div className={classes.first}>
                <div className={classes.row}>
                  <div className={classes.col2}>
                    <EditableNumber
                      label="Alert me over"
                      name="cashInAlertThreshold"
                      editing={editing === CASH_IN_KEY}
                      displayValue={x => (x === '' ? '-' : x)}
                      decoration="notes"
                      width={fieldWidth}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Form>
          <Form className={classes.form}>
            <PromptWhenDirty />
            <Header
              title="Load boxes - Aveiro (Empty)"
              editing={editing === LOAD_BOXES_KEY}
              disabled={editing !== LOAD_BOXES_KEY}
              setEditing={() => setEditing(LOAD_BOXES_KEY)}
            />
            <div className={classes.wrapper}>
              {R.map(
                it => (
                  <>
                    <div className={classes.row}>
                      <Cashbox
                        labelClassName={classes.cashboxLabel}
                        emptyPartClassName={classes.cashboxEmptyPart}
                        percent={
                          values[`fillingPercentageCassette${it + 1}`] ??
                          data[`cassette${it + 1}`]
                        }
                        applyColorVariant
                        applyFiatBalanceAlertsStyling
                        omitInnerPercentage
                        cashOut
                      />
                      <div className={classes.col2}>
                        <TL2 className={classes.title}>Cassette {it + 1}</TL2>
                        <EditableNumber
                          label="Alert me under"
                          name={`fillingPercentageCassette${it + 1}`}
                          editing={editing === LOAD_BOXES_KEY}
                          displayValue={x => (x === '' ? '-' : x)}
                          decoration="%"
                          width={fieldWidth}
                        />
                      </div>
                    </div>
                  </>
                ),
                R.times(R.identity, maxNumberOfCassettes)
              )}
            </div>
          </Form>
          <Form className={classes.form}>
            <PromptWhenDirty />
            <Header
              title="Cassettes & Recyclers (Empty)"
              editing={editing === CASSETTES_RECYCLERS_KEY}
              disabled={editing !== CASSETTES_RECYCLERS_KEY}
              setEditing={() => setEditing(CASSETTES_RECYCLERS_KEY)}
            />
            <div className={classes.wrapper}>
              {R.chain(
                it => [
                  <>
                    <div className={classes.row}>
                      <Cashbox
                        labelClassName={classes.cashboxLabel}
                        emptyPartClassName={classes.cashboxEmptyPart}
                        percent={
                          values[`fillingPercentageStacker${it + 1}f`] ??
                          data[`stacker${it + 1}f`]
                        }
                        applyColorVariant
                        applyFiatBalanceAlertsStyling
                        omitInnerPercentage
                        cashOut
                      />
                      <div className={classes.col2}>
                        <TL2 className={classes.title}>Stacker {it + 1}F</TL2>
                        <EditableNumber
                          label="Alert me under"
                          name={`fillingPercentageStacker${it + 1}f`}
                          editing={editing === CASSETTES_RECYCLERS_KEY}
                          displayValue={x => (x === '' ? '-' : x)}
                          decoration="%"
                          width={fieldWidth}
                        />
                      </div>
                    </div>
                  </>,
                  <>
                    <div className={classes.row}>
                      <Cashbox
                        labelClassName={classes.cashboxLabel}
                        emptyPartClassName={classes.cashboxEmptyPart}
                        percent={
                          values[`fillingPercentageStacker${it + 1}r`] ??
                          data[`stacker${it + 1}r`]
                        }
                        applyColorVariant
                        applyFiatBalanceAlertsStyling
                        omitInnerPercentage
                        cashOut
                      />
                      <div className={classes.col2}>
                        <TL2 className={classes.title}>Stacker {it + 1}R</TL2>
                        <EditableNumber
                          label="Alert me under"
                          name={`fillingPercentageStacker${it + 1}r`}
                          editing={editing === CASSETTES_RECYCLERS_KEY}
                          displayValue={x => (x === '' ? '-' : x)}
                          decoration="%"
                          width={fieldWidth}
                        />
                      </div>
                    </div>
                  </>
                ],
                R.times(R.identity, maxNumberOfStackers)
              )}
            </div>
          </Form>
        </>
      )}
    </Formik>
  )
}

export default FiatBalance
