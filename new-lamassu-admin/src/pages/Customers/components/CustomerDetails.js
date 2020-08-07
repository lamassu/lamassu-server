import { makeStyles, Box } from '@material-ui/core'
import moment from 'moment'
import * as R from 'ramda'
import React, { memo } from 'react'

import { H2, Label1, P } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { comet } from 'src/styling/variables'
import { ifNotNull } from 'src/utils/nullCheck'

import FrontCameraPhoto from './FrontCameraPhoto'

const styles = {
  icon: {
    marginRight: 11
  },
  name: {
    marginTop: 6
  },
  value: {
    height: 16
  },
  label: {
    marginBottom: 4,
    color: comet
  }
}

const useStyles = makeStyles(styles)

const CustomerDetails = memo(({ customer }) => {
  const classes = useStyles()
  const LastTxIcon = customer.lastTxClass === 'cashOut' ? TxOutIcon : TxInIcon

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
          <LastTxIcon className={classes.icon} />
          {`${Number.parseFloat(customer.lastTxFiat)} 
            ${customer.lastTxFiatCode}`}
        </>
      )
    }
  ]

  return (
    <Box display="flex">
      <FrontCameraPhoto
        frontCameraPath={R.path(['frontCameraPath'])(customer)}
      />
      <Box display="flex" flexDirection="column">
        <div className={classes.name}>
          <H2 noMargin>
            {R.path(['name'])(customer) ?? R.path(['phone'])(customer)}
          </H2>
        </div>
        <Box display="flex" mt="auto">
          {elements.map(({ size, header }, idx) => (
            <Label1
              noMargin
              key={idx}
              className={classes.label}
              style={{ width: size }}>
              {header}
            </Label1>
          ))}
        </Box>
        <Box display="flex">
          {elements.map(({ size, value }, idx) => (
            <P
              noMargin
              key={idx}
              className={classes.value}
              style={{ width: size }}>
              {value}
            </P>
          ))}
        </Box>
      </Box>
    </Box>
  )
})

export default CustomerDetails
