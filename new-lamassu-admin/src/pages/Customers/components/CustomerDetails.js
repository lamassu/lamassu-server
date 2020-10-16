import { makeStyles, Box } from '@material-ui/core'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import * as R from 'ramda'
import React, { memo } from 'react'

import { SubpageButton } from 'src/components/buttons'
import { H2, Label1, P } from 'src/components/typography'
import { ReactComponent as IdIcon } from 'src/styling/icons/ID/card/zodiac.svg'
import { ReactComponent as LawIconInverse } from 'src/styling/icons/circle buttons/law/white.svg'
import { ReactComponent as LawIcon } from 'src/styling/icons/circle buttons/law/zodiac.svg'

import mainStyles from '../CustomersList.styles'

import FrontCameraPhoto from './FrontCameraPhoto'

const useStyles = makeStyles(mainStyles)

const CustomerDetails = memo(({ customer, locale, setShowCompliance }) => {
  const classes = useStyles()

  const elements = [
    {
      header: 'Phone number',
      size: 172,
      value:
        customer.phone && locale.country
          ? parsePhoneNumberFromString(
              customer.phone,
              locale.country
            ).formatInternational()
          : ''
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

  return (
    <Box display="flex">
      <FrontCameraPhoto
        frontCameraPath={R.path(['frontCameraPath'])(customer)}
      />
      <Box display="flex" flexDirection="column">
        <div className={classes.name}>
          <IdIcon className={classes.idIcon} />
          <H2 noMargin>
            {R.path(['name'])(customer) ?? R.path(['phone'])(customer)}
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
