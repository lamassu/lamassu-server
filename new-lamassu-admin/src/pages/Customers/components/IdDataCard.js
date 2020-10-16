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

import Field from './Field'

const IdDataCard = memo(({ customerData, updateCustomer }) => {
  const idData = R.path(['idCardData'])(customerData)
  const rawExpirationDate = R.path(['expirationDate'])(idData)
  const rawDob = R.path(['dateOfBirth'])(idData)

  const elements = [
    {
      header: 'Name',
      display: `${R.path(['firstName'])(idData)} ${R.path(['lastName'])(
        idData
      )}`,
      size: 160
    },
    {
      header: 'ID number',
      display: R.path(['documentNumber'])(idData),
      size: 190
    },
    {
      header: 'Age',
      display: ifNotNull(
        rawDob,
        moment.utc().diff(moment.utc(rawDob).format('YYYY-MM-D'), 'years')
      ),
      size: 70
    },
    {
      header: 'Gender',
      display: R.path(['gender'])(idData),
      size: 100
    },
    {
      header: 'Country',
      display: R.path(['country'])(idData),
      size: 140
    },
    {
      header: 'Expiration Date',
      display: ifNotNull(
        rawExpirationDate,
        moment.utc(rawExpirationDate).format('YYYY-MM-D')
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
