import { makeStyles } from '@material-ui/core/styles'
import React, { memo } from 'react'
import { Paper } from '@material-ui/core'

import { ReactComponent as CrossedCameraIcon } from 'src/styling/icons/ID/photo/crossed-camera.svg'

import { mainStyles } from '../Customers.styles'

import { IMAGES_URI } from './variables'

const useStyles = makeStyles(mainStyles)

const FrontCameraPhoto = memo(({ frontCameraPath }) => {
  const classes = useStyles()

  return (
    <Paper className={classes.photo} elevation={0}>
      {frontCameraPath ? (
        <img
          src={`${IMAGES_URI}/front-camera-photo/${frontCameraPath}`}
          alt=""
        />
      ) : (
        <CrossedCameraIcon />
      )}
    </Paper>
  )
})

export default FrontCameraPhoto
