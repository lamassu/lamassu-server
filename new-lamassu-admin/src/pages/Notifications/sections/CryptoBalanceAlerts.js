import { makeStyles } from '@material-ui/core'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import { fromNamespace } from 'src/utils/config'
import { transformNumber } from 'src/utils/number'

import SingleFieldEditableNumber from '../components/SingleFieldEditableNumber'

import styles from './CryptoBalanceAlerts.styles'

const useStyles = makeStyles(styles)

const CryptoBalanceAlerts = ({
  fieldWidth,
  data,
  save,
  error,
  setError,
  editing,
  setEditing
}) => {
  const { config, notificationSettings } = data
  const classes = useStyles()

  const eventName = 'cryptoBalance'
  const value = R.find(it => it.event === eventName && R.isNil(it.overrideId))(
    notificationSettings
  )
  const currencyCode = fromNamespace('locale')(config).fiatCurrency

  const schema = Yup.object()
    .shape({
      event: Yup.string().required(),
      overrideId: Yup.string().nullable(),
      value: Yup.object().shape({
        lowerBound: Yup.number()
          .transform(transformNumber)
          .integer()
          .min(0)
          .max(9999999)
          .nullable(),
        upperBound: Yup.number()
          .transform(transformNumber)
          .integer()
          .min(0)
          .max(9999999)
          .nullable()
      })
    })
    .test((values, context) => {
      const {
        value: { upperBound, lowerBound }
      } = values
      return !R.isNil(upperBound) &&
        !R.isNil(lowerBound) &&
        R.gte(lowerBound, upperBound)
        ? context.createError({
            message:
              'The high balance limit should be higher than the low balance limit'
          })
        : true
    })

  const _save = _value => {
    return schema
      .validate(_value)
      .then(value => {
        setError(false)
        return save(value)
      })
      .catch(error => setError(error.message))
  }

  return (
    <>
      <div className={classes.cryptoBalanceAlerts}>
        <SingleFieldEditableNumber
          value={value}
          valueField={'lowerBound'}
          save={_save}
          suffix={currencyCode}
          className={classes.cryptoBalanceAlertsForm}
          title="Default (Low Balance)"
          label="Alert me under"
          editing={editing}
          setEditing={setEditing}
          width={fieldWidth}
        />

        <div className={classes.vertSeparator} />

        <SingleFieldEditableNumber
          value={value}
          valueField={'upperBound'}
          save={_save}
          suffix={currencyCode}
          className={classes.cryptoBalanceAlertsSecondForm}
          title="Default (High Balance)"
          label="Alert me over"
          editing={editing}
          setEditing={setEditing}
          width={fieldWidth}
        />
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </>
  )
}

export default CryptoBalanceAlerts
