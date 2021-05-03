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

const NAME = 'fiatBalanceAlerts'

const FiatBalance = ({ section, min = 0, max = 100, fieldWidth = 80 }) => {
  const { isEditing, isDisabled, setEditing, data, save } = useContext(
    NotificationsCtx
  )
  const classes = useStyles()

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
      .nullable()
  })

  return (
    <Formik
      validateOnBlur={false}
      validateOnChange={false}
      enableReinitialize
      initialValues={{
        fillingPercentageCassette1: data?.fillingPercentageCassette1 ?? '',
        fillingPercentageCassette2: data?.fillingPercentageCassette2 ?? ''
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
              <Cashbox
                labelClassName={classes.cashboxLabel}
                emptyPartClassName={classes.cashboxEmptyPart}
                percent={data?.fillingPercentageCassette1}
                inFiatBalanceAlerts={true}
                cashOut
              />
              <div className={classes.col2}>
                <TL2 className={classes.title}>Cassette 1 (Top)</TL2>
                <EditableNumber
                  label="Alert me under"
                  name="fillingPercentageCassette1"
                  editing={editing}
                  displayValue={x => (x === '' ? '-' : x)}
                  decoration="%"
                  width={fieldWidth}
                />
              </div>
            </div>
          </div>
          <div className={classes.row}>
            <Cashbox
              labelClassName={classes.cashboxLabel}
              emptyPartClassName={classes.cashboxEmptyPart}
              percent={data?.fillingPercentageCassette2}
              inFiatBalanceAlerts={true}
              cashOut
            />
            <div className={classes.col2}>
              <TL2 className={classes.title}>Cassette 2 (Bottom)</TL2>
              <EditableNumber
                label="Alert me under"
                name="fillingPercentageCassette2"
                editing={editing}
                displayValue={x => (x === '' ? '-' : x)}
                decoration="%"
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
