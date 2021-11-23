import { Box } from '@material-ui/core'
import { differenceInYears, format } from 'date-fns'
import * as R from 'ramda'
import React, { memo } from 'react'

import {
  PropertyCard,
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'
import { ifNotNull } from 'src/utils/nullCheck'
import { toUtc } from 'src/utils/timezones'

import { getName } from '../helper'

import Field from './Field'

const IdDataCard = memo(({ customerData, updateCustomer }) => {
  const idData = R.path(['idCardData'])(customerData)
  const rawExpirationDate = R.path(['expirationDate'])(idData)
  const country = R.path(['country'])(idData)
  const rawDob = R.path(['dateOfBirth'])(idData)

  const elements = [
    {
      header: 'Name',
      display: `${getName(customerData)}`,
      size: 190
    },
    {
      header: 'ID number',
      display: R.path(['documentNumber'])(idData),
      size: 160
    },
    {
      header: 'Birth Date',
      display: ifNotNull(rawDob, format(rawDob, 'YYYY-MM-DD')),
      size: 110
    },
    {
      header: 'Age',
      display: ifNotNull(
        rawDob,
        differenceInYears(toUtc(new Date()), toUtc(rawDob))
      ),
      size: 50
    },
    {
      header: 'Gender',
      display: R.path(['gender'])(idData) ?? R.path(['sex'])(idData),
      size: 80
    },
    {
      header: country === 'Canada' ? 'Province' : 'State',
      display: R.path(['state'])(idData),
      size: 120
    },
    {
      header: 'Expiration Date',
      display: ifNotNull(
        rawExpirationDate,
        format(rawExpirationDate, 'YYYY-MM-DD')
      )
    }
  ]

  return (
    <PropertyCard
      title={'ID data'}
      state={R.path(['idCardDataOverride'])(customerData)}
      authorize={() =>
        updateCustomer({ idCardDataOverride: OVERRIDE_AUTHORIZED })
      }
      reject={() => updateCustomer({ idCardDataOverride: OVERRIDE_REJECTED })}>
      <Box display="flex" alignItems="center">
        {elements.map(({ header, display, size }, idx) => (
          <Field key={idx} label={header} display={display} size={size} />
        ))}
      </Box>
    </PropertyCard>
  )
})

export default IdDataCard
