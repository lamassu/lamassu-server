import ButtonBase from '@material-ui/core/ButtonBase'
import Paper from '@material-ui/core/Card'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { memo, useState } from 'react'

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

const PhotosCard = memo(({ frontCameraPath, txData }) => {
  const classes = useStyles()

  const [photosDialog, setPhotosDialog] = useState(false)

  const txsWithCustomerPhoto = R.filter(
    tx => !R.isNil(tx.txCustomerPhotoAt) && !R.isNil(tx.txCustomerPhotoPath)
  )(txData)

  const photoDir = frontCameraPath
    ? 'front-camera-photo'
    : 'operator-data/customersphotos'

  const photo =
    frontCameraPath ?? R.head(txsWithCustomerPhoto)?.txCustomerPhotoPath

  return (
    <>
      <Paper className={classes.photo} elevation={0}>
        <ButtonBase
          className={classes.button}
          onClick={() => {
            setPhotosDialog(true)
          }}>
          {photo ? (
            <div className={classes.container}>
              <img
                className={classes.img}
                src={`${URI}/${photoDir}/${photo}`}
                alt=""
              />
              <circle className={classes.circle}>
                <div>
                  <Info2>{txsWithCustomerPhoto.length}</Info2>
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
        title={`Photos roll`}
        data={<PhotosCarousel txData={txData}></PhotosCarousel>}
        onDissmised={() => {
          setPhotosDialog(false)
        }}
      />
    </>
  )
})

export const PhotosCarousel = memo(({ txData }) => {
  const classes = useStyles()

  return (
    <>
      <div className={classes.firstRow}>
        <div>
          <div>
            <Label>Session ID</Label>
            <CopyToClipboard>{txData && R.head(txData)?.id}</CopyToClipboard>
          </div>
        </div>
      </div>
      <div className={classes.secondRow}>
        <div>
          <div>
            <Label>Date</Label>
            <div>{txData && R.head(txData)?.txCustomerPhotoAt}</div>
          </div>
        </div>
        <div>
          <Label>Taken by</Label>
          <div>{'Acceptance of T&C'}</div>
        </div>
      </div>
    </>
  )
})

export default PhotosCard
