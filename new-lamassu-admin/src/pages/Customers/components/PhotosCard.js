import ButtonBase from '@material-ui/core/ButtonBase'
import Paper from '@material-ui/core/Card'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { memo, useState } from 'react'
import Carousel from 'react-material-ui-carousel'

import { InformativeDialog } from 'src/components/InformativeDialog'
import { Info2, Label1 } from 'src/components/typography'
import { ReactComponent as CrossedCameraIcon } from 'src/styling/icons/ID/photo/crossed-camera.svg'
import { URI } from 'src/utils/apollo'

import CopyToClipboard from '../../Transactions/CopyToClipboard'

import styles from './PhotosCard.styles'

const useStyles = makeStyles(styles)

const Label = ({ children }) => {
  const classes = useStyles()
  return <Label1 className={classes.label}>{children}</Label1>
}

const PhotosCard = memo(({ frontCameraData, txPhotosData }) => {
  const classes = useStyles()

  const [photosDialog, setPhotosDialog] = useState(false)

  const mapKeys = pair => {
    const key = R.head(pair)
    const value = R.last(pair)
    if (key === 'txCustomerPhotoPath' || key === 'frontCameraPath') {
      return ['path', value]
    }
    if (key === 'txCustomerPhotoAt' || key === 'frontCameraAt') {
      return ['date', value]
    }
    return pair
  }

  const addPhotoDir = R.map(it => {
    const hasFrontCameraData = R.has('id')(it)
    return hasFrontCameraData
      ? { ...it, photoDir: 'operator-data/customersphotos' }
      : { ...it, photoDir: 'front-camera-photo' }
  })

  const standardizeKeys = R.map(
    R.compose(R.fromPairs, R.map(mapKeys), R.toPairs)
  )

  const filterByPhotoAvailable = R.filter(
    tx => !R.isNil(tx.date) && !R.isNil(tx.path)
  )

  const photosData = filterByPhotoAvailable(
    addPhotoDir(standardizeKeys(R.append(frontCameraData, txPhotosData)))
  )

  const singlePhoto = R.head(photosData)

  const isPhotoRollAvailable = () => {
    return !singlePhoto
  }

  return (
    <>
      <Paper className={classes.photo} elevation={0}>
        <ButtonBase
          disabled={isPhotoRollAvailable()}
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

export const PhotosCarousel = memo(({ photosData }) => {
  const classes = useStyles()
  const [currentIndex, setCurrentIndex] = useState(0)

  const isFaceCustomerPhoto = !R.has('id')(photosData[currentIndex])

  const slidePhoto = index => setCurrentIndex(index)

  return (
    <>
      <Carousel
        navButtonsProps={{
          style: {
            backgroundColor: 'transparent',
            borderRadius: 0,
            fontSize: 100
          }
        }}
        className={classes.slideButtons}
        autoPlay={false}
        indicators={false}
        navButtonsAlwaysVisible={true}
        next={activeIndex => slidePhoto(activeIndex)}
        prev={activeIndex => slidePhoto(activeIndex)}>
        {photosData.map((item, i) => (
          <div>
            <div className={classes.imgWrapper}>
              <img
                className={classes.imgInner}
                src={`${URI}/${item?.photoDir}/${item?.path}`}
                alt=""
              />
            </div>
          </div>
        ))}
      </Carousel>
      {!isFaceCustomerPhoto && (
        <div className={classes.firstRow}>
          <Label>Session ID</Label>
          <CopyToClipboard>
            {photosData && photosData[currentIndex]?.id}
          </CopyToClipboard>
        </div>
      )}
      <div className={classes.secondRow}>
        <div>
          <div>
            <Label>Date</Label>
            <div>{photosData && photosData[currentIndex]?.date}</div>
          </div>
        </div>
        <div>
          <Label>Taken by</Label>
          <div>
            {!isFaceCustomerPhoto ? 'Acceptance of T&C' : 'Compliance scan'}
          </div>
        </div>
      </div>
    </>
  )
})

export default PhotosCard
