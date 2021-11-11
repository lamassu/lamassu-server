import { makeStyles, Box } from '@material-ui/core'
import * as R from 'ramda'
import React, { memo } from 'react'

import { SubpageButton } from 'src/components/buttons'
import { H2, Label1, P } from 'src/components/typography'
import { ReactComponent as IdIcon } from 'src/styling/icons/ID/card/zodiac.svg'
import { ReactComponent as LawIconInverse } from 'src/styling/icons/circle buttons/law/white.svg'
import { ReactComponent as LawIcon } from 'src/styling/icons/circle buttons/law/zodiac.svg'

import mainStyles from '../CustomersList.styles'
import { getFormattedPhone, getName } from '../helper'

import PhotosCard from './PhotosCard'

const useStyles = makeStyles(mainStyles)

const CustomerDetails = memo(
  ({ txData, customer, locale, setShowCompliance }) => {
    const classes = useStyles()

    const idNumber = R.path(['idCardData', 'documentNumber'])(customer)
    const usSsn = R.path(['usSsn'])(customer)

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

    const name = getName(customer)

    return (
      <Box display="flex">
        <PhotosCard
          frontCameraData={R.pick(['frontCameraPath', 'frontCameraAt'])(
            customer
          )}
          txPhotosData={
            txData &&
            R.map(R.pick(['id', 'txCustomerPhotoPath', 'txCustomerPhotoAt']))(
              txData
            )
          }
        />
        <Box display="flex" flexDirection="column">
          <div className={classes.name}>
            <IdIcon className={classes.idIcon} />
            <H2 noMargin>
              {name.length
                ? name
                : getFormattedPhone(
                    R.path(['phone'])(customer),
                    locale.country
                  )}
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
  }
)

export default CustomerDetails
