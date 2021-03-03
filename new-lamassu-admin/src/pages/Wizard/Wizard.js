import { useQuery } from '@apollo/react-hooks'
import { makeStyles, Dialog, DialogContent } from '@material-ui/core'
import classnames from 'classnames'
import gql from 'graphql-tag'
import React, { useState, useContext } from 'react'
import { useHistory } from 'react-router-dom'

import AppContext from 'src/AppContext'
import { getWizardStep, STEPS } from 'src/pages/Wizard/helper'
import { backgroundColor } from 'src/styling/variables'

import Footer from './components/Footer'

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

const GET_DATA = gql`
  query getData {
    config
    accounts
    cryptoCurrencies {
      code
      display
    }
  }
`

const Wizard = ({ fromAuthRegister }) => {
  const classes = useStyles()
  const { data, loading } = useQuery(GET_DATA)
  const history = useHistory()
  const { setWizardTested } = useContext(AppContext)

  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(true)

  const [footerExp, setFooterExp] = useState(false)

  if (loading) {
    return <></>
  }

  const wizardStep = getWizardStep(data?.config, data?.cryptoCurrencies)

  const shouldGoBack =
    history.length && !history.location.state?.fromAuthRegister

  if (wizardStep === 0) {
    setWizardTested(true)
    shouldGoBack ? history.goBack() : history.push('/')
  }

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
    if (step >= STEPS.length - 1) {
      setOpen(false)
      history.push('/')
    }

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
