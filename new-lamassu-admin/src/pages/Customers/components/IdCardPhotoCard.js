import { makeStyles } from '@material-ui/core/styles'
import moment from 'moment'
import * as R from 'ramda'
import React, { memo } from 'react'

import {
  PropertyCard,
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'
import { ReactComponent as CrossedCameraIcon } from 'src/styling/icons/ID/photo/crossed-camera.svg'
import { URI } from 'src/utils/apollo'

import mainStyles from '../CustomersList.styles'

import Field from './Field'

const useStyles = makeStyles(mainStyles)

const IdCardPhotoCard = memo(({ customerData, updateCustomer }) => {
  const classes = useStyles()

  return (
    <PropertyCard
      className={classes.idCardPhotoCard}
      title={'ID card photo'}
      state={R.path(['idCardPhotoOverride'])(customerData)}
      authorize={() =>
        updateCustomer({ idCardPhotoOverride: OVERRIDE_AUTHORIZED })
      }
      reject={() => updateCustomer({ idCardPhotoOverride: OVERRIDE_REJECTED })}>
      <div className={classes.row}>
        {customerData.idCardPhotoPath ? (
          <img
            className={classes.idCardPhoto}
            src={`${URI}/id-card-photo/${R.path(['idCardPhotoPath'])(
              customerData
            )}`}
            alt=""
          />
        ) : (
          <CrossedCameraIcon />
        )}
        <Field
          label={'Expiration date'}
          display={moment
            .utc(R.path(['idCardDataExpiration'])(customerData))
            .format('YYYY-MM-D')}
        />
      </div>
    </PropertyCard>
  )
})

export default IdCardPhotoCard
