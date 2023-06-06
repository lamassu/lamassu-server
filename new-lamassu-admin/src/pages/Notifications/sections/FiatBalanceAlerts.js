import { makeStyles } from '@material-ui/core'
import { Form, Formik } from 'formik'
import * as R from 'ramda'
import React, { useContext } from 'react'
import * as Yup from 'yup'

import PromptWhenDirty from 'src/components/PromptWhenDirty'
import { TL2 } from 'src/components/typography'
import { transformNumber } from 'src/utils/number'

import { Cashbox } from '../../../components/inputs/cashbox/Cashbox'
import NotificationsCtx from '../NotificationsContext'
import Header from '../components/EditHeader'
import EditableNumber from '../components/EditableNumber'

import styles from './FiatBalanceAlerts.styles.js'

const useStyles = makeStyles(styles)

const CASH_IN_KEY = 'fiatBalanceAlertsCashIn'
const CASH_OUT_KEY = 'fiatBalanceAlertsCashOut'
const RECYCLER_STACKER_KEY = 'fiatBalanceAlertsRecyclerStacker'
const DEFAULT_NUMBER_OF_CASSETTES = 2
const DEFAULT_NUMBER_OF_STACKERS = 0
const notesMin = 0
const notesMax = 9999999

const FiatBalance = ({ section, min = 0, max = 100, fieldWidth = 80 }) => {
  const {
    isEditing,
    isDisabled,
    setEditing,
    data,
    save,
    machines = []
  } = useContext(NotificationsCtx)
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
      onSubmit={it => save(section, schema.cast(it))}
      onReset={() => {
        setEditing(CASH_IN_KEY, false)
        setEditing(CASH_OUT_KEY, false)
      }}>
      {({ values }) => (
        <>
          <Form className={classes.form}>
            <PromptWhenDirty />
            <Header
              title="Cash box"
              editing={isEditing(CASH_IN_KEY)}
              disabled={isDisabled(CASH_IN_KEY)}
              setEditing={it => setEditing(CASH_IN_KEY, it)}
            />
            <div className={classes.wrapper}>
              <div className={classes.first}>
                <div className={classes.row}>
                  <div className={classes.col2}>
                    <EditableNumber
                      label="Alert me over"
                      name="cashInAlertThreshold"
                      editing={isEditing(CASH_IN_KEY)}
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
              title="Cash out (Empty)"
              editing={isEditing(CASH_OUT_KEY)}
              disabled={isDisabled(CASH_OUT_KEY)}
              setEditing={it => setEditing(CASH_OUT_KEY, it)}
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
                          editing={isEditing(CASH_OUT_KEY)}
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
              title="Cash recycling (stackers)"
              editing={isEditing(RECYCLER_STACKER_KEY)}
              disabled={isDisabled(RECYCLER_STACKER_KEY)}
              setEditing={it => setEditing(RECYCLER_STACKER_KEY, it)}
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
                          editing={isEditing(RECYCLER_STACKER_KEY)}
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
                          editing={isEditing(RECYCLER_STACKER_KEY)}
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
