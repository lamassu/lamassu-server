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

const NAME = 'fiatBalanceAlerts'
const DEFAULT_NUMBER_OF_CASSETTES = 2

const FiatBalance = ({ section, min = 0, max = 100, fieldWidth = 80 }) => {
  const {
    isEditing,
    isDisabled,
    setEditing,
    data,
    save,
    machines
  } = useContext(NotificationsCtx)
  const classes = useStyles()

  const maxNumberOfCassettes =
    Math.max(...R.map(it => it.numberOfCassettes, machines)) ??
    DEFAULT_NUMBER_OF_CASSETTES

  const editing = isEditing(NAME)

  const schema = Yup.object().shape({
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
        fillingPercentageCassette1: data?.fillingPercentageCassette1 ?? '',
        fillingPercentageCassette2: data?.fillingPercentageCassette2 ?? '',
        fillingPercentageCassette3: data?.fillingPercentageCassette3 ?? '',
        fillingPercentageCassette4: data?.fillingPercentageCassette4 ?? ''
      }}
      validationSchema={schema}
      onSubmit={it => save(section, schema.cast(it))}
      onReset={() => {
        setEditing(NAME, false)
      }}>
      {({ values }) => (
        <Form className={classes.form}>
          <PromptWhenDirty />
          <Header
            title="Cash out (Empty)"
            editing={editing}
            disabled={isDisabled(NAME)}
            setEditing={it => setEditing(NAME, it)}
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
                        editing={editing}
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
      )}
    </Formik>
  )
}

export default FiatBalance
