import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import moment from 'moment'
import React, { memo } from 'react'

import { H2 } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'

import { mainStyles } from '../Customers.styles'
import { ifNotNull } from '../../../utils/nullCheck'

import FrontCameraPhoto from './FrontCameraPhoto'

const useStyles = makeStyles(mainStyles)

const CustomerDetails = memo(({ customer }) => {
  const classes = useStyles()

  const elements = [
    {
      header: 'Transactions',
      size: 127,
      value: ifNotNull(
        customer.totalTxs,
        `${Number.parseInt(customer.totalTxs)}`
      )
    },
    {
      header: 'Transaction volume',
      size: 167,
      value: ifNotNull(
        customer.totalSpent,
        `${Number.parseFloat(customer.totalSpent)} ${customer.lastTxFiatCode}`
      )
    },
    {
      header: 'Last active',
      size: 142,
      value: ifNotNull(
        customer.lastActive,
        moment.utc(customer.lastActive).format('YYYY-MM-D')
      )
    },
    {
      header: 'Last transaction',
      size: 198,
      value: ifNotNull(
        customer.lastTxFiat,
        <>
          {`${Number.parseFloat(customer.lastTxFiat)} 
            ${customer.lastTxFiatCode}`}
          {customer.lastTxClass === 'cashOut' ? (
            <TxOutIcon className={classes.txClassIconRight} />
          ) : (
            <TxInIcon className={classes.txClassIconRight} />
          )}
        </>
      )
    }
  ]

  return (
    <div className={classes.customerDetails}>
      <FrontCameraPhoto
        frontCameraPath={R.path(['frontCameraPath'])(customer)}
      />
      <div>
        <div className={classes.rowCenterAligned}>
          <H2 className={classes.customerName}>{R.path(['name'])(customer)}</H2>
        </div>
        <div className={classes.rowCenterAligned}>
          {elements.map(({ size, header }, idx) => (
            <div key={idx} className={classes.label1} style={{ width: size }}>
              {header}
            </div>
          ))}
        </div>
        <div className={classes.rowCenterAligned}>
          {elements.map(({ size, value }, idx) => (
            <div key={idx} className={classes.p} style={{ width: size }}>
              {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default CustomerDetails
