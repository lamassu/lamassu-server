import { makeStyles, Box } from '@material-ui/core'
import * as R from 'ramda'
import React, { memo } from 'react'

import { SubpageButton } from 'src/components/buttons'
import { H2, Label1, P } from 'src/components/typography'
import { ReactComponent as IdIcon } from 'src/styling/icons/ID/card/zodiac.svg'
import { ReactComponent as LawIconInverse } from 'src/styling/icons/circle buttons/law/white.svg'
import { ReactComponent as LawIcon } from 'src/styling/icons/circle buttons/law/zodiac.svg'

import mainStyles from '../CustomersList.styles'
import { /* getFormattedPhone, */ getName } from '../helper'

import FrontCameraPhoto from './FrontCameraPhoto'

const useStyles = makeStyles(mainStyles)

const CustomerDetails = memo(({ customer, locale, setShowCompliance }) => {
  const classes = useStyles()

  const elements = [
    {
      header: 'Phone number',
      size: 172,
      value: customer.phone // getFormattedPhone(customer.phone, locale.country)
    },
    {
      header: 'ID number',
      size: 172,
      value: R.path(['idCardData', 'documentNumber'])(customer) ?? ''
    },
    {
      header: 'US SSN',
      size: 127,
      value: R.path(['usSsn'])(customer) ?? ''
    }
  ]

  const name = getName(customer)

  return (
    <Box display="flex">
      <FrontCameraPhoto
        frontCameraPath={R.path(['frontCameraPath'])(customer)}
      />
      <Box display="flex" flexDirection="column">
        <div className={classes.name}>
          <IdIcon className={classes.idIcon} />
          <H2 noMargin>
            {name.length ? name : R.path(['phone'])(customer)}
            {/* getFormattedPhone(R.path(['phone'])(customer), locale.country)} */}
          </H2>
          <SubpageButton
            className={classes.subpageButton}
            Icon={LawIcon}
            InverseIcon={LawIconInverse}
            toggle={setShowCompliance}>
            Compliance details
          </SubpageButton>
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
