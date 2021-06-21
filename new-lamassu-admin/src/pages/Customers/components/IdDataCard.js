import { Box } from '@material-ui/core'
import moment from 'moment'
import * as R from 'ramda'
import React, { memo } from 'react'

import {
  PropertyCard,
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'
import { ifNotNull } from 'src/utils/nullCheck'

import { getName } from '../helper'

import Field from './Field'

const formatGender = field => {
  // In US cards, gender comes as a number. In BC and ZA cards, gender comes as a letter
  const genderMap = {
    1: 'M',
    2: 'F'
  }

  const isNumber = s => {
    if (typeof s !== 'string') return false
    return !isNaN(s) && !isNaN(parseInt(s))
  }

  return !isNumber(field) ? field : genderMap[field]
}

const IdDataCard = memo(({ customerData, updateCustomer }) => {
  const idData = R.path(['idCardData'])(customerData)
  const rawExpirationDate = R.path(['expirationDate'])(idData)
  const country = R.path(['country'])(idData)
  const rawDob = R.path(['dateOfBirth'])(idData)
  console.log('customer', customerData)

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
      display: ifNotNull(rawDob, moment.utc(rawDob).format('YYYY-MM-DD')),
      size: 110
    },
    {
      header: 'Age',
      display: ifNotNull(
        rawDob,
        moment.utc().diff(moment.utc(rawDob).format('YYYY-MM-DD'), 'years')
      ),
      size: 50
    },
    {
      header: 'Gender',
      display: formatGender(
        R.path(['gender'])(idData) ?? R.path(['sex'])(idData)
      ),
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
        moment.utc(rawExpirationDate).format('YYYY-MM-DD')
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
