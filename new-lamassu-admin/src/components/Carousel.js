import { makeStyles } from '@material-ui/core/styles'
import React, { memo } from 'react'
import ReactCarousel from 'react-material-ui-carousel'

import { URI } from 'src/utils/apollo'

const useStyles = makeStyles({
  imgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    width: 550,
    height: 550
  },
  imgInner: {
    objectFit: 'cover',
    objectPosition: 'center',
    width: 550,
    height: 550,
    marginBottom: 40
  }
})

export const Carousel = memo(({ photosData, slidePhoto }) => {
  const classes = useStyles()

  return (
    <>
      <ReactCarousel
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
      </ReactCarousel>
    </>
  )
})
