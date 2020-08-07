import { makeStyles, Box } from '@material-ui/core'
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

const useStyles = makeStyles({
  idDataCard: {
    width: 550,
    height: 240
  },
  column: {
    marginBottom: 7
  }
})

const IdDataCard = memo(({ customerData, updateCustomer }) => {
  const classes = useStyles()

  const idData = R.path(['idCardData'])(customerData)

  const name = R.path(['firstName'])(idData) ?? ''
  const lastName = R.path(['lastName'])(idData) ?? ''

  const gender = R.path(['gender'])(idData)
  const idNumber = R.path(['documentNumber'])(idData)
  const country = R.path(['country'])(idData)

  const rawExpirationDate = R.path(['expirationDate'])(idData)
  const expirationDate = ifNotNull(
    rawExpirationDate,
    moment.utc(rawExpirationDate).format('YYYY-MM-D')
  )

  const rawDob = R.path(['dateOfBirth'])(idData)
  const age = ifNotNull(
    rawDob,
    moment.utc().diff(moment.utc(rawDob).format('YYYY-MM-D'), 'years')
  )

  return (
    <PropertyCard
      className={classes.idDataCard}
      title={'ID data'}
      state={R.path(['idCardDataOverride'])(customerData)}
      authorize={() =>
        updateCustomer({ idCardDataOverride: OVERRIDE_AUTHORIZED })
      }
      reject={() => updateCustomer({ idCardDataOverride: OVERRIDE_REJECTED })}>
      <div>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1}>
          <Field label={'Name'} display={`${name} ${lastName}`} />
          <Field label={'ID number'} display={idNumber} />
          <Field label={'Age'} display={age} />
        </Box>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Field label={'Gender'} display={gender} />
          <Field label={'Country'} display={country} />
          <Field label={'Expiration date'} display={expirationDate} />
        </Box>
      </div>
    </PropertyCard>
  )
})

export default IdDataCard
