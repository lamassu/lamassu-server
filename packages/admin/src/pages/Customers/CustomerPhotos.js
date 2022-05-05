import { makeStyles, Paper } from '@material-ui/core'
import { format } from 'date-fns/fp'
import * as R from 'ramda'
import { React, useState } from 'react'

import { InformativeDialog } from 'src/components/InformativeDialog'
import { Label2, H3 } from 'src/components/typography'
import { ReactComponent as CameraIcon } from 'src/styling/icons/ID/photo/comet.svg'
import { URI } from 'src/utils/apollo'

import styles from './CustomerPhotos.styles'
import PhotosCarousel from './components/PhotosCarousel'

const useStyles = makeStyles(styles)

const CustomerPhotos = ({ photosData, timezone }) => {
  const classes = useStyles()

  const [photosDialog, setPhotosDialog] = useState(false)
  const [photoClickedIndex, setPhotoClickIndex] = useState(null)
  const orderedPhotosData = !R.isNil(photoClickedIndex)
    ? R.compose(R.flatten, R.reverse, R.splitAt(photoClickedIndex))(photosData)
    : photosData

  return (
    <div>
      <div className={classes.header}>
        <H3 className={classes.title}>{'Photos & files'}</H3>
      </div>
      <div className={classes.photosChipList}>
        {photosData.map((elem, idx) => (
          <PhotoCard
            idx={idx}
            date={elem.date}
            src={`${URI}/${elem.photoDir}/${elem.path}`}
            setPhotosDialog={setPhotosDialog}
            setPhotoClickIndex={setPhotoClickIndex}
          />
        ))}
      </div>
      <InformativeDialog
        open={photosDialog}
        title={`Photo roll`}
        data={
          <PhotosCarousel photosData={orderedPhotosData} timezone={timezone} />
        }
        onDissmised={() => {
          setPhotosDialog(false)
          setPhotoClickIndex(null)
        }}
      />
    </div>
  )
}

export const PhotoCard = ({
  idx,
  date,
  src,
  setPhotosDialog,
  setPhotoClickIndex
}) => {
  const classes = useStyles()

  return (
    <Paper
      className={classes.photoCardChip}
      onClick={() => {
        setPhotoClickIndex(idx)
        setPhotosDialog(true)
      }}>
      <img className={classes.image} src={src} alt="" />
      <div className={classes.footer}>
        <CameraIcon />
        <Label2 className={classes.date}>
          {format('yyyy-MM-dd', new Date(date))}
        </Label2>
      </div>
    </Paper>
  )
}

export default CustomerPhotos
