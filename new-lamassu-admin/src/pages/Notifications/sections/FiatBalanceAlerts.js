import { makeStyles } from '@material-ui/core'
import { Form, Formik } from 'formik'
import React, { useContext } from 'react'
import * as Yup from 'yup'

import PromptWhenDirty from 'src/components/PromptWhenDirty'
import { TL2 } from 'src/components/typography'

import { Cashbox } from '../../../components/inputs/cashbox/Cashbox'
import NotificationsCtx from '../NotificationsContext'
import Header from '../components/EditHeader'
import EditableNumber from '../components/EditableNumber'

import styles from './FiatBalanceAlerts.styles.js'

const useStyles = makeStyles(styles)

const NAME = 'fiatBalanceAlerts'

const FiatBalance = ({
  section,
  max = Number.MAX_SAFE_INTEGER,
  fieldWidth = 80
}) => {
  const { isEditing, isDisabled, setEditing, data, save } = useContext(
    NotificationsCtx
  )
  const classes = useStyles()

  const editing = isEditing(NAME)

  const schema = Yup.object().shape({
    fiatBalanceCassette1: Yup.number()
      .integer()
      .min(0)
      .max(max)
      .required(),
    fiatBalanceCassette2: Yup.number()
      .integer()
      .min(0)
      .max(max)
      .required()
  })

  const fiatBalanceCassette1Percent =
    (100 * (data?.fiatBalanceCassette1 ?? 0)) / max
  const fiatBalanceCassette2Percent =
    (100 * (data?.fiatBalanceCassette2 ?? 0)) / max

  return (
    <Formik
      enableReinitialize
      initialValues={{
        fiatBalanceCassette1: data?.fiatBalanceCassette1 ?? '',
        fiatBalanceCassette2: data?.fiatBalanceCassette2 ?? ''
      }}
      validationSchema={schema}
      onSubmit={it => save(section, schema.cast(it))}
      onReset={() => {
        setEditing(NAME, false)
      }}>
      <Form className={classes.form}>
        <PromptWhenDirty />
        <Header
          title="Cash out (Empty)"
          editing={editing}
          disabled={isDisabled(NAME)}
          setEditing={it => setEditing(NAME, it)}
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
                  editing={editing}
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
                editing={editing}
                displayValue={x => (x === '' ? '-' : x)}
                decoration="notes"
                width={fieldWidth}
              />
            </div>
          </div>
        </div>
      </Form>
    </Formik>
  )
}

export default FiatBalance
