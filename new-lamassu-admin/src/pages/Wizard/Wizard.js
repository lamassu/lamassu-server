import { makeStyles, Dialog, DialogContent } from '@material-ui/core'
import classnames from 'classnames'
import React, { useState } from 'react'

import { backgroundColor } from 'src/styling/variables'

import Footer from './components/Footer'
import { STEPS } from './helper'

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    padding: [[16, 0]],
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: backgroundColor
  },
  welcomeBackground: {
    background: 'url(/wizard-background.svg) no-repeat center center fixed',
    backgroundColor: backgroundColor,
    backgroundSize: 'cover'
  },
  blurred: {
    filter: 'blur(4px)',
    pointerEvents: 'none'
  }
})

const Wizard = ({ wizardStep }) => {
  const [step, setStep] = useState(0)
  const classes = useStyles()
  const [open, setOpen] = useState(true)
  const [footerExp, setFooterExp] = useState(false)

  const isWelcome = step === 0
  const classNames = {
    [classes.blurred]: footerExp,
    [classes.wrapper]: true,
    [classes.welcomeBackground]: isWelcome
  }

  const start = () => {
    setFooterExp(false)
  }

  const doContinue = () => {
    if (step >= STEPS.length - 1) return setOpen(false)

    const nextStep = step === 0 && wizardStep ? wizardStep : step + 1

    setFooterExp(true)
    setStep(nextStep)
  }
  const current = STEPS[step]

  return (
    <Dialog fullScreen open={open}>
      <DialogContent className={classnames(classNames)}>
        <current.Component doContinue={doContinue} isActive={!footerExp} />
      </DialogContent>
      {!isWelcome && (
        <Footer
          currentStep={step}
          steps={STEPS.length - 1}
          exImage={current.exImage}
          subtitle={current.subtitle}
          text={current.text}
          open={footerExp}
          start={start}
        />
      )}
    </Dialog>
  )
}

export default Wizard
