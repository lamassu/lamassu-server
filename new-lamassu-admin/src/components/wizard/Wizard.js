import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core'

import { Button } from 'src/components/buttons'
import { ReactComponent as CompleteIcon } from 'src/styling/icons/stage/spring/complete.svg'
import { ReactComponent as CurrentIcon } from 'src/styling/icons/stage/spring/current.svg'
import { ReactComponent as EmptyIcon } from 'src/styling/icons/stage/spring/empty.svg'

import { mainStyles } from './Wizard.styles'

const useStyles = makeStyles(mainStyles)

const Wizard = ({ header, nextStepText, finalStepText, finish, children }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const classes = useStyles()

  const handleMoveToNextStep = nextStepIndex => {
    const finalStepIndex = children.length - 1

    if (nextStepIndex > finalStepIndex) {
      finish()
    } else {
      setCurrentStepIndex(nextStepIndex)
    }
  }

  const currentStep = children[currentStepIndex]
  const finalStepIndex = children.length - 1
  const isFinalStep = currentStepIndex === finalStepIndex

  return (
    <>
      <div className={classes.header}>{header}</div>
      <div className={classes.body}>
        <div className={classes.columnWrapper}>
          {/* TODO: wizard steps icons are a little strange... */}
          <div className={classes.wizardStepsWrapper}>
            {children.map((e, i) => {
              const elementToRender = []

              if (i < currentStepIndex)
                elementToRender.push(
                  <CompleteIcon key={elementToRender.length} />
                )
              else if (i === currentStepIndex)
                elementToRender.push(
                  <CurrentIcon key={elementToRender.length} />
                )
              else
                elementToRender.push(<EmptyIcon key={elementToRender.length} />)

              if (i < currentStepIndex)
                elementToRender.push(
                  <div
                    className={classes.reachedStepLine}
                    key={elementToRender.length}
                  />
                )
              else if (i < finalStepIndex)
                elementToRender.push(
                  <div
                    className={classes.unreachedStepLine}
                    key={elementToRender.length}
                  />
                )

              return elementToRender
            })}
          </div>
          {currentStep}
          <div className={classes.bottomRightAligned}>
            <Button onClick={() => handleMoveToNextStep(currentStepIndex + 1)}>
              {isFinalStep ? finalStepText : nextStepText}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Wizard
