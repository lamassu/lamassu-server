import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import * as R from 'ramda'
import React from 'react'

import ImagePopper from 'src/components/ImagePopper'
import { H3, Info3 } from 'src/components/typography'
import {
  PropertyCard,
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'
import { ReactComponent as CrossedCameraIcon } from 'src/styling/icons/ID/photo/crossed-camera.svg'
import { URI } from 'src/utils/apollo'

import { complianceDetailsStyles } from './ComplianceDetails.styles'
import Field from './Field'

import { IdDataCard } from './'

const useStyles = makeStyles(complianceDetailsStyles)

const imageWidth = 165
const imageHeight = 45

const Photo = ({ show, src }) => {
  const classes = useStyles({ width: imageWidth })

  return (
    <>
      {show ? (
        <ImagePopper src={src} width={imageWidth} height={imageHeight} />
      ) : (
        <div className={classes.photoWrapper}>
          <CrossedCameraIcon />
        </div>
      )}
    </>
  )
}

const ComplianceDetails = ({ customer, locale, updateCustomer }) => {
  const classes = useStyles({ width: imageWidth })

  const phone =
    customer.phone && locale.country
      ? parsePhoneNumberFromString(
          customer.phone,
          locale.country
        ).formatInternational()
      : ''

  const sanctions = R.path(['sanctions'])(customer)
  const sanctionsAt = R.path(['sanctionsAt'])(customer)
  const sanctionsDisplay = !sanctionsAt
    ? 'Not checked yet'
    : sanctions
    ? 'Passed'
    : 'Failed'

  return (
    <div>
      <H3>Compliance details</H3>
      <div>
        <IdDataCard customerData={customer} updateCustomer={updateCustomer} />
        <Box className={classes.complianceDetailsGrid}>
          <Box className={classes.firstColumn}>
            <PropertyCard
              title={'Phone nº'}
              state={R.path(['smsOverride'])(customer)}
              authorize={() =>
                updateCustomer({ smsOverride: OVERRIDE_AUTHORIZED })
              }
              reject={() => updateCustomer({ smsOverride: OVERRIDE_REJECTED })}>
              <Field label={'Phone'} display={phone} />
            </PropertyCard>
            <PropertyCard
              title={'ID photo'}
              state={R.path(['idCardPhotoOverride'])(customer)}
              authorize={() =>
                updateCustomer({ idCardPhotoOverride: OVERRIDE_AUTHORIZED })
              }
              reject={() =>
                updateCustomer({ idCardPhotoOverride: OVERRIDE_REJECTED })
              }>
              <Photo
                show={customer.idCardPhotoPath}
                src={`${URI}/id-card-photo/${R.path(['idCardPhotoPath'])(
                  customer
                )}`}
              />
            </PropertyCard>
            <PropertyCard
              title={'Front facing camera'}
              state={R.path(['frontCameraOverride'])(customer)}
              authorize={() =>
                updateCustomer({ frontCameraOverride: OVERRIDE_AUTHORIZED })
              }
              reject={() =>
                updateCustomer({ frontCameraOverride: OVERRIDE_REJECTED })
              }>
              <Photo
                show={customer.frontCameraPath}
                src={`${URI}/front-camera-photo/${R.path(['frontCameraPath'])(
                  customer
                )}`}
              />
            </PropertyCard>
          </Box>
          <Box className={classes.lastColumn}>
            <PropertyCard
              title={'US SSN'}
              state={R.path(['usSsnOverride'])(customer)}
              authorize={() =>
                updateCustomer({ usSsnOverride: OVERRIDE_AUTHORIZED })
              }
              reject={() =>
                updateCustomer({ usSsnOverride: OVERRIDE_REJECTED })
              }>
              <Field label={'US SSN'} display={customer.usSsn} />
            </PropertyCard>
            <PropertyCard
              title={'Sanctions check'}
              state={R.path(['sanctionsOverride'])(customer)}
              authorize={() =>
                updateCustomer({ sanctionsOverride: OVERRIDE_AUTHORIZED })
              }
              reject={() =>
                updateCustomer({ sanctionsOverride: OVERRIDE_REJECTED })
              }>
              <Info3>{sanctionsDisplay}</Info3>
            </PropertyCard>
          </Box>
        </Box>
      </div>
    </div>
  )
}

export default ComplianceDetails
