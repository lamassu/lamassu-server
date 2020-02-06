import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { memo } from 'react'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

import {
  PropertyCard,
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'

import { mainStyles } from '../Customers.styles'

import Field from './Field'

const useStyles = makeStyles(mainStyles)

const PhoneCard = memo(({ customerData, updateCustomer }) => {
  const classes = useStyles()

  return (
    <PropertyCard
      className={classes.phoneCard}
      title={'Phone'}
      state={R.path(['smsOverride'])(customerData)}
      authorize={() => updateCustomer({ smsOverride: OVERRIDE_AUTHORIZED })}
      reject={() => updateCustomer({ smsOverride: OVERRIDE_REJECTED })}>
      <Field
        label={'Phone'}
        display={
          R.path(['phone'])(customerData)
            ? parsePhoneNumberFromString(
                R.path(['phone'])(customerData)
              ).formatInternational()
            : []
        }
      />
    </PropertyCard>
  )
})

export default PhoneCard
