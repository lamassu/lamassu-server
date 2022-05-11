import { makeStyles } from '@material-ui/core'
import * as R from 'ramda'
import React, { useState } from 'react'

import Sidebar, { Stepper } from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'
import styles from 'src/pages/AddMachine/styles'

import AllSet from './AllSet'
import Blockcypher from './Blockcypher'
import ChooseCoin from './ChooseCoin'
import ChooseExchange from './ChooseExchange'
import ChooseTicker from './ChooseTicker'
import ChooseWallet from './ChooseWallet'

const useStyles = makeStyles(styles)

const steps = [
  {
    label: 'Choose cryptocurrency',
    component: ChooseCoin
  },
  {
    label: 'Choose wallet',
    component: ChooseWallet
  },
  {
    label: 'Choose ticker',
    component: ChooseTicker
  },
  {
    label: 'Exchange',
    component: ChooseExchange
  },
  {
    label: 'Blockcypher',
    component: Blockcypher
  },
  {
    label: 'All set',
    component: AllSet
  }
]

const Wallet = ({ doContinue }) => {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})

  const classes = useStyles()
  const mySteps = data?.coin === 'BTC' ? steps : R.remove(4, 1, steps)

  const Component = mySteps[step].component

  const addData = it => {
    setData(R.merge(data, it))
    setStep(step + 1)
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.headerDiv}>
        <TitleSection title="Wallet settings"></TitleSection>
      </div>
      <div className={classes.contentDiv}>
        <Sidebar>
          {mySteps.map((it, idx) => (
            <Stepper key={idx} step={step} it={it} idx={idx} steps={mySteps} />
          ))}
        </Sidebar>
        <div className={classes.contentWrapper}>
          <Component data={data} addData={addData} doContinue={doContinue} />
        </div>
      </div>
    </div>
  )
}

export default Wallet
