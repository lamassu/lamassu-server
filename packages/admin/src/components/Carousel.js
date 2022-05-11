import { makeStyles } from '@material-ui/core/styles'
import React, { memo } from 'react'
import ReactCarousel from 'react-material-ui-carousel'

import { ReactComponent as LeftArrow } from 'src/styling/icons/arrow/carousel-left-arrow.svg'
import { ReactComponent as RightArrow } from 'src/styling/icons/arrow/carousel-right-arrow.svg'
import { URI } from 'src/utils/apollo'

const useStyles = makeStyles({
  imgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex'
  },
  imgInner: {
    objectFit: 'cover',
    objectPosition: 'center',
    width: 500,
    marginBottom: 40
  }
})

export const Carousel = memo(({ photosData, slidePhoto }) => {
  const classes = useStyles()

  return (
    <>
      <ReactCarousel
        PrevIcon={<LeftArrow />}
        NextIcon={<RightArrow />}
        navButtonsProps={{
          style: {
            backgroundColor: 'transparent',
            borderRadius: 0,
            color: 'transparent',
            opacity: 1
          }
        }}
        navButtonsWrapperProps={{
          style: {
            marginLeft: -22,
            marginRight: -22
          }
        }}
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
      </ReactCarousel>
    </>
  )
})
