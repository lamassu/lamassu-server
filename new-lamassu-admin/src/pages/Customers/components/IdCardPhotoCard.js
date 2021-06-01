import { makeStyles, Box } from '@material-ui/core'
import * as R from 'ramda'
import React, { memo } from 'react'

import {
  PropertyCard,
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'
import { ReactComponent as CrossedCameraIcon } from 'src/styling/icons/ID/photo/crossed-camera.svg'
import { URI } from 'src/utils/apollo'

const useStyles = makeStyles({
  idCardPhotoCard: {
    width: 325,
    height: 240,
    margin: [[32, 0, 0, 0]]
  },
  idCardPhoto: {
    maxHeight: 130
  },
  field: {
    marginLeft: 14
  }
})

const IdCardPhotoCard = memo(({ customerData, updateCustomer }) => {
  const classes = useStyles()

  return (
    <PropertyCard
      title={'ID photo'}
      state={R.path(['idCardPhotoOverride'])(customerData)}
      authorize={() =>
        updateCustomer({ idCardPhotoOverride: OVERRIDE_AUTHORIZED })
      }
      reject={() => updateCustomer({ idCardPhotoOverride: OVERRIDE_REJECTED })}>
      <Box display="flex" flex="1" justifyContent="center" alignItems="center">
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
      </Box>
    </PropertyCard>
  )
})

export default IdCardPhotoCard
