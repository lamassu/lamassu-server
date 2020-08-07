import { makeStyles } from '@material-ui/core/styles'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import * as R from 'ramda'
import React, { memo } from 'react'

import {
  PropertyCard,
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'

import Field from './Field'

const useStyles = makeStyles({
  phoneCard: {
    width: 300,
    height: 240
  }
})

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
