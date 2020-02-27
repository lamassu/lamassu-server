import React, { memo } from 'react'
import * as R from 'ramda'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core'

import { ReactComponent as CompleteStageIconSpring } from 'src/styling/icons/stage/spring/complete.svg'
import { ReactComponent as CurrentStageIconSpring } from 'src/styling/icons/stage/spring/current.svg'
import { ReactComponent as EmptyStageIconSpring } from 'src/styling/icons/stage/spring/empty.svg'
import { ReactComponent as CompleteStageIconZodiac } from 'src/styling/icons/stage/zodiac/complete.svg'
import { ReactComponent as CurrentStageIconZodiac } from 'src/styling/icons/stage/zodiac/current.svg'
import { ReactComponent as EmptyStageIconZodiac } from 'src/styling/icons/stage/zodiac/empty.svg'
import {
  primaryColor,
  secondaryColor,
  offColor,
  disabledColor
} from 'src/styling/variables'

const styles = {
  stages: {
    display: 'flex',
    alignItems: 'center'
  },
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    margin: 0
  },
  stage: {
    display: 'flex',
    height: 28,
    width: 28,
    zIndex: 2,
    '& > svg': {
      height: '100%',
      width: '100%',
      overflow: 'visible'
    }
  },
  separator: {
    width: 28,
    height: 2,
    border: [[2, 'solid']],
    zIndex: 1
  },
  separatorSpring: {
    borderColor: secondaryColor
  },
  separatorZodiac: {
    borderColor: primaryColor
  },
  separatorSpringEmpty: {
    borderColor: disabledColor
  },
  separatorZodiacEmpty: {
    borderColor: offColor
  }
}

const useStyles = makeStyles(styles)

const Stage = memo(({ stages, currentStage, color = 'spring', className }) => {
  if (currentStage < 1 || currentStage > stages)
    throw Error('Value of currentStage is invalid')
  if (stages < 1) throw Error('Value of stages is invalid')

  const classes = useStyles()

  const separatorClasses = {
    [classes.separator]: true,
    [classes.separatorSpring]: color === 'spring',
    [classes.separatorZodiac]: color === 'zodiac'
  }

  const separatorEmptyClasses = {
    [classes.separator]: true,
    [classes.separatorSpringEmpty]: color === 'spring',
    [classes.separatorZodiacEmpty]: color === 'zodiac'
  }

  return (
    <div className={classnames(className, classes.stages)}>
      {R.range(1, currentStage).map(idx => (
        <div key={idx} className={classes.wrapper}>
          {idx > 1 && <div className={classnames(separatorClasses)} />}
          <div className={classes.stage}>
            {color === 'spring' && <CompleteStageIconSpring />}
            {color === 'zodiac' && <CompleteStageIconZodiac />}
          </div>
        </div>
      ))}
      <div className={classes.wrapper}>
        {currentStage > 1 && <div className={classnames(separatorClasses)} />}
        <div className={classes.stage}>
          {color === 'spring' && <CurrentStageIconSpring />}
          {color === 'zodiac' && <CurrentStageIconZodiac />}
        </div>
      </div>
      {R.range(currentStage + 1, stages + 1).map(idx => (
        <div key={idx} className={classes.wrapper}>
          <div className={classnames(separatorEmptyClasses)} />
          <div className={classes.stage}>
            {color === 'spring' && <EmptyStageIconSpring />}
            {color === 'zodiac' && <EmptyStageIconZodiac />}
          </div>
        </div>
      ))}
    </div>
  )
})

export default Stage
