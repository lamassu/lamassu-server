import { makeStyles } from '@material-ui/core'
import { useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import React, { useState } from 'react'

import { Switch } from 'src/components/inputs'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'
import { P, Info2 } from 'src/components/typography'
import { spacer } from 'src/styling/variables'

import Table from '../../components/cashout-table/Table'
import Title from '../../components/Title'
import { mainStyles } from '../Transactions/Transactions.styles'

const GET_MACHINES_AND_CONFIG = gql`
  {
    machines {
      name
      deviceId
      cashbox
      cassette1
      cassette2
    }
    config
  }
`

const useStyles = makeStyles({
  ...mainStyles,
  help: {
    width: 20,
    height: 20,
    marginLeft: spacer * 2
  }
})

const Cashboxes = () => {
  const [machines, setMachines] = useState([])
  const classes = useStyles()

  useQuery(GET_MACHINES_AND_CONFIG, {
    onCompleted: data =>
      setMachines(
        data.machines.map(m => ({
          ...m,
          currency: data.config.fiatCurrency ?? { code: 'N/D' },
          cashOutDenominations: (data.config.cashOutDenominations ?? {})[
            m.deviceId
          ],
          overrides: { top: {}, bottom: {} }
        }))
      )
  })

  const elements = [
    {
      header: 'Machine',
      size: 254,
      textAlign: 'left',
      view: m => m.name
    },
    {
      header: 'Cassette 1 (Top)',
      size: 265,
      textAlign: 'left',
      view: ({ cashOutDenominations, currency }) => (
        <>
          {cashOutDenominations && cashOutDenominations.top && (
            <Info2>
              {cashOutDenominations.top} {currency.code}
            </Info2>
          )}
        </>
      )
    },
    {
      header: 'Cassette 2',
      size: 265,
      textAlign: 'left',
      view: ({ cashOutDenominations, currency }) => (
        <>
          {cashOutDenominations && cashOutDenominations.bottom && (
            <Info2>
              {cashOutDenominations.bottom} {currency.code}
            </Info2>
          )}
        </>
      )
    },
    {
      header: 'Edit',
      size: 265,
      textAlign: 'left'
    },
    {
      header: 'Enable',
      size: 151,
      textAlign: 'right'
    }
  ]

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Cash-out</Title>
        </div>
        <div>
          <P>
            Transaction fudge factor <Switch checked={true} /> On{' '}
            <HelpIcon className={classes.help} />
          </P>
        </div>
      </div>
      <Table elements={elements} data={machines} />
    </>
  )
}

export default Cashboxes
