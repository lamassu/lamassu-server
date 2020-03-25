import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import { gql } from 'apollo-boost'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'

import Title from 'src/components/Title'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'

import { mainStyles } from './Customers.styles'

const useStyles = makeStyles(mainStyles)

const GET_CUSTOMERS = gql`
  {
    customers {
      name
      phone
      totalTxs
      totalSpent
      lastActive
      lastTxFiat
      lastTxFiatCode
      lastTxClass
    }
  }
`

const Customers = () => {
  const classes = useStyles()

  const { data: customersResponse } = useQuery(GET_CUSTOMERS)

  const elements = [
    {
      header: 'Name',
      width: 277,
      view: R.path(['name'])
    },
    {
      header: 'Phone',
      width: 166,
      view: it => parsePhoneNumberFromString(it.phone)?.formatInternational()
    },
    {
      header: 'Total TXs',
      width: 174,
      textAlign: 'right',
      view: it => `${Number.parseInt(it.totalTxs)}`
    },
    {
      header: 'Total spent',
      width: 188,
      textAlign: 'right',
      view: it =>
        it.lastTxFiatCode
          ? `${Number.parseFloat(it.totalSpent)} ${it.lastTxFiatCode}`
          : null
    },
    {
      header: 'Last active',
      width: 197,
      view: it =>
        it.lastActive ? moment.utc(it.lastActive).format('YYYY-MM-D') : null
    },
    {
      header: 'Last transaction',
      width: 198,
      textAlign: 'right',
      view: it =>
        it.lastTxFiatCode ? (
          <div>
            {`${Number.parseFloat(it.lastTxFiat)} ${it.lastTxFiatCode} `}
            {it.lastTxClass === 'cashOut' ? <TxOutIcon /> : <TxInIcon />}
          </div>
        ) : null
    }
  ]

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Customers</Title>
        </div>
        <div className={classes.headerLabels}>
          <div>
            <TxOutIcon />
            <span>Cash-out</span>
          </div>
          <div>
            <TxInIcon />
            <span>Cash-in</span>
          </div>
        </div>
      </div>
      <DataTable
        elements={elements}
        data={R.sortWith([
          R.ascend(R.prop('name')),
          R.descend(R.prop('lastActive'))
        ])(R.path(['customers'])(customersResponse) ?? [])}
      />
    </>
  )
}

export default Customers
