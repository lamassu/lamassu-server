import ButtonBase from '@material-ui/core/ButtonBase'
import Paper from '@material-ui/core/Card'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { memo, useState } from 'react'

import { InformativeDialog } from 'src/components/InformativeDialog'
import { Info2 } from 'src/components/typography'
import { ReactComponent as CrossedCameraIcon } from 'src/styling/icons/ID/photo/crossed-camera.svg'
import { URI } from 'src/utils/apollo'

import styles from './PhotosCard.styles'
import PhotosCarousel from './PhotosCarousel'

const useStyles = makeStyles(styles)

const PhotosCard = memo(({ photosData }) => {
  const classes = useStyles()

  const [photosDialog, setPhotosDialog] = useState(false)

  const singlePhoto = R.head(photosData)

  return (
    <>
      <Paper className={classes.photo} elevation={0}>
        <ButtonBase
          disabled={!singlePhoto}
          className={classes.button}
          onClick={() => {
            setPhotosDialog(true)
          }}>
          {singlePhoto ? (
            <div className={classes.container}>
              <img
                className={classes.img}
                src={`${URI}/${singlePhoto.photoDir}/${singlePhoto.path}`}
                alt=""
              />
              <circle className={classes.circle}>
                <div>
                  <Info2>{photosData.length}</Info2>
                </div>
              </circle>
            </div>
          ) : (
            <CrossedCameraIcon />
          )}
        </ButtonBase>
      </Paper>
      <InformativeDialog
        open={photosDialog}
        title={`Photo roll`}
        data={<PhotosCarousel photosData={photosData} />}
        onDissmised={() => {
          setPhotosDialog(false)
        }}
      />
    </>
  )
})

export default PhotosCard
