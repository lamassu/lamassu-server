import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo } from 'react'
import { Paper } from '@material-ui/core'

import { ActionButton } from 'src/components/buttons'
import { H3 } from 'src/components/typography'
import { ReactComponent as AuthorizeReversedIcon } from 'src/styling/icons/button/authorize/white.svg'
import { ReactComponent as AuthorizeIcon } from 'src/styling/icons/button/authorize/zodiac.svg'
import { ReactComponent as RejectReversedIcon } from 'src/styling/icons/button/cancel/white.svg'
import { ReactComponent as RejectIcon } from 'src/styling/icons/button/cancel/zodiac.svg'

import { propertyCardStyles } from './PropertyCard.styles'

const useStyles = makeStyles(propertyCardStyles)

const OVERRIDE_PENDING = 'automatic'
const OVERRIDE_AUTHORIZED = 'verified'
const OVERRIDE_REJECTED = 'blocked'

const PropertyCard = memo(
  ({ className, title, state, authorize, reject, children }) => {
    const classes = useStyles()

    const propertyCardClassNames = {
      [classes.propertyCard]: true,
      [classes.propertyCardPending]: state === OVERRIDE_PENDING,
      [classes.propertyCardRejected]: state === OVERRIDE_REJECTED,
      [classes.propertyCardAccepted]: state === OVERRIDE_AUTHORIZED
    }

    const label1ClassNames = {
      [classes.label1]: true,
      [classes.label1Pending]: state === OVERRIDE_PENDING,
      [classes.label1Rejected]: state === OVERRIDE_REJECTED,
      [classes.label1Accepted]: state === OVERRIDE_AUTHORIZED
    }

    const AuthorizeButton = () => (
      <ActionButton
        className={classes.cardActionButton}
        color="secondary"
        Icon={AuthorizeIcon}
        InverseIcon={AuthorizeReversedIcon}
        onClick={() => authorize()}>
        Authorize
      </ActionButton>
    )

    const RejectButton = () => (
      <ActionButton
        className={classes.cardActionButton}
        color="secondary"
        Icon={RejectIcon}
        InverseIcon={RejectReversedIcon}
        onClick={() => reject()}>
        Reject
      </ActionButton>
    )

    const authorizedAsString =
      state === OVERRIDE_PENDING
        ? 'Pending'
        : state === OVERRIDE_REJECTED
        ? 'Rejected'
        : 'Accepted'

    return (
      <Paper
        className={classnames(propertyCardClassNames, className)}
        elevation={0}>
        <div className={classes.rowSpaceBetween}>
          <H3>{title}</H3>
          <div className={classnames(label1ClassNames)}>
            {authorizedAsString}
          </div>
        </div>
        <Paper className={classes.cardProperties} elevation={0}>
          {children}
        </Paper>
        <div className={classes.buttonsWrapper}>
          {state !== OVERRIDE_AUTHORIZED && AuthorizeButton()}
          {state !== OVERRIDE_REJECTED && RejectButton()}
        </div>
      </Paper>
    )
  }
)

export {
  PropertyCard,
  OVERRIDE_PENDING,
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
}
