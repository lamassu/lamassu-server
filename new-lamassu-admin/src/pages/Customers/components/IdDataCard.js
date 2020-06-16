import { makeStyles } from '@material-ui/core/styles'
import moment from 'moment'
import * as R from 'ramda'
import React, { memo } from 'react'

import {
  PropertyCard,
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'

import mainStyles from '../CustomersList.styles'

import Field from './Field'

const useStyles = makeStyles(mainStyles)

const IdDataCard = memo(({ customerData, updateCustomer }) => {
  const classes = useStyles()

  return (
    <PropertyCard
      className={classes.idDataCard}
      title={'ID data'}
      state={R.path(['idCardDataOverride'])(customerData)}
      authorize={() =>
        updateCustomer({ idCardDataOverride: OVERRIDE_AUTHORIZED })
      }
      reject={() => updateCustomer({ idCardDataOverride: OVERRIDE_REJECTED })}>
      <div className={classes.rowSpaceBetween}>
        <div className={classes.column}>
          <Field
            label={'Name'}
            display={`${R.path(['idCardData', 'firstName'])(
              customerData
            )} ${R.path(['idCardData', 'lastName'])(customerData)}`}
          />
          <Field
            label={'Gender'}
            display={R.path(['idCardData', 'gender'])(customerData)}
          />
        </div>
        <div className={classes.column}>
          <Field
            label={'ID number'}
            display={R.path(['idCardData', 'documentNumber'])(customerData)}
          />
          <Field
            label={'Country'}
            display={R.path(['idCardData', 'country'])(customerData)}
          />
        </div>
        <div className={classes.column}>
          <Field
            label={'Age'}
            display={moment
              .utc()
              .diff(
                moment
                  .utc(R.path(['idCardData', 'dateOfBirth'])(customerData))
                  .format('YYYY-MM-D'),
                'years'
              )}
          />
          <Field
            label={'Expiration date'}
            display={moment
              .utc(R.path(['idCardData', 'expirationDate'])(customerData))
              .format('YYYY-MM-D')}
          />
        </div>
      </div>
    </PropertyCard>
  )
})

export default IdDataCard
