import { parsePhoneNumberFromString } from 'libphonenumber-js'
import * as R from 'ramda'
import React, { memo } from 'react'

import {
  PropertyCard,
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'

import Field from './Field'

const PhoneCard = memo(
  ({ className, customerData, updateCustomer, locale }) => (
    <PropertyCard
      className={className}
      title={'Phone nº'}
      state={R.path(['smsOverride'])(customerData)}
      authorize={() => updateCustomer({ smsOverride: OVERRIDE_AUTHORIZED })}
      reject={() => updateCustomer({ smsOverride: OVERRIDE_REJECTED })}>
      <Field
        label={'Phone'}
        display={
          customerData.phone && locale.country
            ? parsePhoneNumberFromString(
                customerData.phone,
                locale.country
              ).formatInternational()
            : ''
        }
      />
    </PropertyCard>
  )
)

export default PhoneCard
