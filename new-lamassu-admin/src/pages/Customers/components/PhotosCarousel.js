import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { memo, useState } from 'react'

import { Carousel } from 'src/components/Carousel'
import { Label1 } from 'src/components/typography'

import CopyToClipboard from '../../Transactions/CopyToClipboard'

import styles from './PhotosCarousel.styles'

const useStyles = makeStyles(styles)

const PhotosCarousel = memo(({ photosData }) => {
  const classes = useStyles()
  const [currentIndex, setCurrentIndex] = useState(0)

  const Label = ({ children }) => {
    const classes = useStyles()
    return <Label1 className={classes.label}>{children}</Label1>
  }

  const isFaceCustomerPhoto = !R.has('id')(photosData[currentIndex])

  const slidePhoto = index => setCurrentIndex(index)

  return (
    <>
      <Carousel photosData={photosData} slidePhoto={slidePhoto} />
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

export default PhotosCarousel
