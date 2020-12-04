import { makeStyles } from '@material-ui/core'
import { Form, Formik } from 'formik'
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

const FiatBalance = ({
  section,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  fieldWidth = 80
}) => {
  const { isEditing, isDisabled, setEditing, data, save } = useContext(
    NotificationsCtx
  )
  const classes = useStyles()

  const schema = Yup.object().shape({
    cashInAlertThreshold: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable(),
    fiatBalanceCassette1: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable(),
    fiatBalanceCassette2: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable()
  })

  const fiatBalanceCassette1Percent =
    (100 * (data?.fiatBalanceCassette1 ?? 0)) / max
  const fiatBalanceCassette2Percent =
    (100 * (data?.fiatBalanceCassette2 ?? 0)) / max

  return (
    <Formik
      enableReinitialize
      initialValues={{
        cashInAlertThreshold: data?.cashInAlertThreshold ?? '',
        fiatBalanceCassette1: data?.fiatBalanceCassette1 ?? '',
        fiatBalanceCassette2: data?.fiatBalanceCassette2 ?? ''
      }}
      validationSchema={schema}
      onSubmit={it => save(section, schema.cast(it))}
      onReset={() => {
        setEditing(CASH_IN_KEY, false)
        setEditing(CASH_OUT_KEY, false)
      }}>
      <>
        <Form className={classes.form}>
          <PromptWhenDirty />
          <Header
            title="Cash in (Full)"
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
            <div className={classes.first}>
              <div className={classes.row}>
                <Cashbox percent={fiatBalanceCassette1Percent} cashOut />
                <div className={classes.col2}>
                  <TL2 className={classes.title}>Cassette 1 (Top)</TL2>
                  <EditableNumber
                    label="Alert me under"
                    name="fiatBalanceCassette1"
                    editing={isEditing(CASH_OUT_KEY)}
                    displayValue={x => (x === '' ? '-' : x)}
                    decoration="notes"
                    width={fieldWidth}
                  />
                </div>
              </div>
            </div>
            <div className={classes.row}>
              <Cashbox percent={fiatBalanceCassette2Percent} cashOut />
              <div className={classes.col2}>
                <TL2 className={classes.title}>Cassette 2 (Bottom)</TL2>
                <EditableNumber
                  label="Alert me under"
                  name="fiatBalanceCassette2"
                  editing={isEditing(CASH_OUT_KEY)}
                  displayValue={x => (x === '' ? '-' : x)}
                  decoration="notes"
                  width={fieldWidth}
                />
              </div>
            </div>
          </div>
        </Form>
      </>
    </Formik>
  )
}

export default FiatBalance
