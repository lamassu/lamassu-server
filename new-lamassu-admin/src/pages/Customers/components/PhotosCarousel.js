import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { memo, useState } from 'react'

import { Carousel } from 'src/components/Carousel'
import { Label1 } from 'src/components/typography'
import { formatDate } from 'src/utils/timezones'

import CopyToClipboard from '../../Transactions/CopyToClipboard'

import styles from './PhotosCarousel.styles'

const useStyles = makeStyles(styles)

const PhotosCarousel = memo(({ photosData, timezone }) => {
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
          <>
            <Label>Date</Label>
            <div>
              {photosData &&
                formatDate(
                  photosData[currentIndex]?.date,
                  timezone,
                  'yyyy-MM-dd HH:mm'
                )}
            </div>
          </>
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
