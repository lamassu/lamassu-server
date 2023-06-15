import { makeStyles } from '@material-ui/core'
import { FieldArray, Form, Formik } from 'formik'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import PromptWhenDirty from 'src/components/PromptWhenDirty'
import { TL2 } from 'src/components/typography'
import { transformNumber } from 'src/utils/number'

import { Cashbox } from '../../../components/inputs/cashbox/Cashbox'
import Header from '../components/EditHeader'
import EditableNumber from '../components/EditableNumber'

import styles from './FiatBalanceAlerts.styles'

const useStyles = makeStyles(styles)

const CASH_IN_KEY = 'cash-in'
const LOAD_BOXES_KEY = 'load-boxes'
const CASSETTES_RECYCLERS_KEY = 'cassettes-recyclers'
const MAX_NUMBER_OF_CASSETTES_RECYCLERS = 4
const MAX_NUMBER_OF_LOAD_BOXES = 2
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
  const { notificationSettings } = data
  const classes = useStyles()

  const eventName = 'unitFillThreshold'
  const value = R.find(it => it.event === eventName && R.isNil(it.overrideId))(
    notificationSettings
  )

  const schema = Yup.object().shape({
    event: Yup.string().required(),
    overrideId: Yup.string().nullable(),
    value: Yup.object().shape({
      cashboxCount: Yup.object().shape({
        upperBound: Yup.number()
          .transform(transformNumber)
          .integer()
          .min(notesMin)
          .max(notesMax)
          .nullable()
      }),
      rejectBoxCount: Yup.object().shape({
        upperBound: Yup.number()
          .transform(transformNumber)
          .integer()
          .min(notesMin)
          .max(notesMax)
          .nullable()
      }),
      loadboxPercentage: Yup.object().shape({
        lowerBound: Yup.array()
          .of(
            Yup.number()
              .transform(transformNumber)
              .integer()
              .min(min)
              .max(max)
              .nullable()
          )
          .length(MAX_NUMBER_OF_LOAD_BOXES)
      }),
      cassetteAndRecyclerPercentage: Yup.object().shape({
        lowerBound: Yup.array()
          .of(
            Yup.number()
              .transform(transformNumber)
              .integer()
              .min(min)
              .max(max)
              .nullable()
          )
          .length(MAX_NUMBER_OF_CASSETTES_RECYCLERS)
      })
    })
  })

  return (
    <Formik
      validateOnBlur={false}
      validateOnChange={false}
      enableReinitialize
      initialValues={value}
      validationSchema={schema}
      onSubmit={it => save(schema.cast(it))}
      onReset={() => setEditing(null)}>
      <div className={classes.formWrapper}>
        <div className={classes.formRow}>
          <Form className={classes.form}>
            <PromptWhenDirty />
            <Header
              title="Cash-In (Full)"
              editing={editing === CASH_IN_KEY}
              disabled={editing !== null}
              setEditing={() => setEditing(CASH_IN_KEY)}
            />
            <div className={classes.wrapper}>
              <div className={classes.row}>
                <div className={classes.col2}>
                  <TL2 className={classes.title}>Cashbox</TL2>
                  <EditableNumber
                    label="Alert me over"
                    name="value.cashboxCount.upperBound"
                    editing={editing === CASH_IN_KEY}
                    displayValue={x => (R.isNil(x) || R.isEmpty(x) ? '-' : x)}
                    decoration="notes"
                    width={fieldWidth}
                  />
                </div>
              </div>
              <div className={classes.row}>
                <div className={classes.col2}>
                  {/* <TL2 className={classes.title}>Rejection box</TL2>
                  <EditableNumber
                    label="Alert me over"
                    name="value.rejectBoxCount.upperBound"
                    editing={editing === CASH_IN_KEY}
                    displayValue={x => (R.isNil(x) || R.isEmpty(x) ? '-' : x)}
                    decoration="notes"
                    width={fieldWidth}
                  /> */}
                </div>
              </div>
            </div>
          </Form>
          <Form className={classes.form}>
            <PromptWhenDirty />
            <Header
              title="Load boxes - Aveiro (Empty)"
              editing={editing === LOAD_BOXES_KEY}
              disabled={editing !== null}
              setEditing={() => setEditing(LOAD_BOXES_KEY)}
            />
            <FieldArray name="value.loadboxPercentage.lowerBound">
              <div className={classes.wrapper}>
                {R.map(
                  it => (
                    <>
                      <div className={classes.row}>
                        <Cashbox
                          labelClassName={classes.cashboxLabel}
                          emptyPartClassName={classes.cashboxEmptyPart}
                          percent={R.defaultTo(
                            0,
                            value?.loadboxPercentage?.lowerBound[it]
                          )}
                          applyColorVariant
                          applyFiatBalanceAlertsStyling
                          omitInnerPercentage
                          cashOut
                        />
                        <div className={classes.col2}>
                          <TL2 className={classes.title}>Load box {it + 1}</TL2>
                          <EditableNumber
                            label="Alert me under"
                            name={`value.loadboxPercentage.lowerBound.${it}`}
                            editing={editing === LOAD_BOXES_KEY}
                            displayValue={x =>
                              R.isNil(x) || R.isEmpty(x) ? '-' : x
                            }
                            decoration="%"
                            width={fieldWidth}
                          />
                        </div>
                      </div>
                    </>
                  ),
                  R.times(R.identity, MAX_NUMBER_OF_LOAD_BOXES)
                )}
              </div>
            </FieldArray>
          </Form>
        </div>
        <div className={classes.formRow}>
          <Form className={classes.form}>
            <PromptWhenDirty />
            <Header
              title="Cassettes & Recyclers (Empty)"
              editing={editing === CASSETTES_RECYCLERS_KEY}
              disabled={editing !== null}
              setEditing={() => setEditing(CASSETTES_RECYCLERS_KEY)}
            />
            <FieldArray name="value.cassetteAndRecyclerPercentage.lowerBound">
              <div className={classes.wrapper}>
                {R.map(
                  it => (
                    <div className={classes.row}>
                      <Cashbox
                        labelClassName={classes.cashboxLabel}
                        emptyPartClassName={classes.cashboxEmptyPart}
                        percent={R.defaultTo(
                          0,
                          value?.cassetteAndRecyclerPercentage?.lowerBound[it]
                        )}
                        applyColorVariant
                        applyFiatBalanceAlertsStyling
                        omitInnerPercentage
                        cashOut
                      />
                      <div className={classes.col2}>
                        <TL2 className={classes.title}>Cassette {it + 1}</TL2>
                        <EditableNumber
                          label="Alert me under"
                          name={`value.cassetteAndRecyclerPercentage.lowerBound.${it}`}
                          editing={editing === CASSETTES_RECYCLERS_KEY}
                          displayValue={x =>
                            R.isNil(x) || R.isEmpty(x) ? '-' : x
                          }
                          decoration="%"
                          width={fieldWidth}
                        />
                      </div>
                    </div>
                  ),
                  R.times(R.identity, MAX_NUMBER_OF_CASSETTES_RECYCLERS)
                )}
              </div>
            </FieldArray>
          </Form>
        </div>
      </div>
    </Formik>
  )
}

export default FiatBalance
