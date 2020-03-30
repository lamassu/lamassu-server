import { makeStyles } from '@material-ui/core'
import React, { useContext } from 'react'

import NotificationsCtx from '../NotificationsContext'
import SingleFieldEditableNumber from '../components/SingleFieldEditableNumber'

import styles from './CryptoBalanceAlerts.styles'

const LOW_BALANCE_KEY = 'cryptoLowBalance'
const HIGH_BALANCE_KEY = 'cryptoHighBalance'

const useStyles = makeStyles(styles)

const CryptoBalanceAlerts = ({ section }) => {
  const classes = useStyles()

  const {
    data,
    save,
    currency,
    setEditing,
    isEditing,
    isDisabled
  } = useContext(NotificationsCtx)

  return (
    <div className={classes.cryptoBalanceAlerts}>
      <SingleFieldEditableNumber
        name={LOW_BALANCE_KEY}
        data={data}
        save={save}
        section={section}
        decoration={currency}
        className={classes.cryptoBalanceAlertsForm}
        title="Default (Low Balance)"
        label="Alert me under"
        editing={isEditing(LOW_BALANCE_KEY)}
        disabled={isDisabled(LOW_BALANCE_KEY)}
        setEditing={it => setEditing(LOW_BALANCE_KEY, it)}
      />

      <div className={classes.vertSeparator} />

      <SingleFieldEditableNumber
        name={HIGH_BALANCE_KEY}
        data={data}
        section={section}
        save={save}
        decoration={currency}
        className={classes.cryptoBalanceAlertsSecondForm}
        title="Default (High Balance)"
        label="Alert me over"
        editing={isEditing(HIGH_BALANCE_KEY)}
        disabled={isDisabled(HIGH_BALANCE_KEY)}
        setEditing={it => setEditing(HIGH_BALANCE_KEY, it)}
      />
    </div>
  )
}

export default CryptoBalanceAlerts
