import { makeStyles } from '@material-ui/core'
import React, { useState, useEffect } from 'react'

import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'
import styles from 'src/pages/AddMachine/styles'
import ChooseCoin from 'src/pages/Wizard/components/ChooseCoin'
import ChooseWallet from 'src/pages/Wizard/components/ChooseWallet'

import AllSet from './AllSet'
import Blockcypher from './Blockcypher'
import ChooseExchange from './ChooseExchange'

const useStyles = makeStyles(styles)

const COIN = 'Choose cryptocurrency'
const WALLET = 'Choose wallet'
const EXCHANGE = 'Exchange'
const CASHOUT_OR_NOT = 'Blockcypher'
const ALL_SET = 'All set'

const pages = [COIN, WALLET, EXCHANGE, CASHOUT_OR_NOT, ALL_SET]

const Wallet = ({ dispatch, namespace }) => {
  useEffect(() => {
    dispatch({ type: 'wizard/SET_STEP', payload: namespace })
  }, [dispatch, namespace])
  const [selected, setSelected] = useState(COIN)
  const classes = useStyles()

  const isSelected = it => selected === it

  return (
    <div className={classes.wrapper}>
      <div className={classes.headerDiv}>
        <TitleSection title="Wallet settings"></TitleSection>
      </div>
      <div className={classes.contentDiv}>
        <Sidebar
          data={pages}
          isSelected={isSelected}
          displayName={it => it}
          onClick={it => setSelected(it)}
        />
        <div className={classes.contentWrapper}>
          {isSelected(COIN) && <ChooseCoin />}
          {isSelected(WALLET) && <ChooseWallet />}
          {isSelected(EXCHANGE) && <ChooseExchange />}
          {isSelected(CASHOUT_OR_NOT) && <Blockcypher />}
          {isSelected(ALL_SET) && <AllSet dispatch={dispatch} />}
        </div>
      </div>
    </div>
  )
}

export default Wallet
