import { makeStyles, Box } from '@material-ui/core'
import * as R from 'ramda'
import React, { memo } from 'react'

import { H2, Label1, P } from 'src/components/typography'
import { ReactComponent as IdIcon } from 'src/styling/icons/ID/card/zodiac.svg'

import mainStyles from '../CustomersList.styles'
import { getFormattedPhone, getName } from '../helper'

import PhotosCard from './PhotosCard'

const useStyles = makeStyles(mainStyles)

const CustomerDetails = memo(({ customer, photosData, locale, timezone }) => {
  const classes = useStyles()

  const idNumber = R.path(['idCardData', 'documentNumber'])(customer)
  const usSsn = R.path(['usSsn'])(customer)
  const name = getName(customer)
  const email = R.path(['email'])(customer)
  const phone = R.path(['phone'])(customer)

  const elements = [
    {
      header: 'Phone number',
      size: 172,
      value: getFormattedPhone(customer.phone, locale.country)
    }
  ]

  if (idNumber)
    elements.push({
      header: 'ID number',
      size: 172,
      value: idNumber
    })

  if (usSsn)
    elements.push({
      header: 'US SSN',
      size: 127,
      value: usSsn
    })

  if (email)
    elements.push({
      header: 'Email',
      size: 190,
      value: email
    })

  return (
    <Box display="flex">
      <PhotosCard photosData={photosData} timezone={timezone} />
      <Box display="flex" flexDirection="column">
        <div className={classes.name}>
          <IdIcon className={classes.idIcon} />
          <H2 noMargin>
            {name.length
              ? name
              : email?.length
              ? email
              : getFormattedPhone(phone, locale.country)}
          </H2>
        </div>
        <Box display="flex" mt="auto">
          {elements.map(({ size, header }, idx) => (
            <Label1
              noMargin
              key={idx}
              className={classes.label}
              style={{ width: size }}>
              {header}
            </Label1>
          ))}
        </Box>
        <Box display="flex">
          {elements.map(({ size, value }, idx) => (
            <P
              noMargin
              key={idx}
              className={classes.value}
              style={{ width: size }}>
              {value}
            </P>
          ))}
        </Box>
      </Box>
    </Box>
  )
})

export default CustomerDetails
