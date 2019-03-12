import React, { useState } from 'react'
import classnames from 'classnames'
import QRCode from 'qrcode.react'
import BigNumber from 'bignumber.js'
import useAxios from '@use-hooks/axios'
import { makeStyles } from '@material-ui/core/styles'

import { H3, Info1, Info3, Info4, Mono } from '../components/typography'
import Title from '../components/Title'
import Sidebar from '../components/Sidebar'
import { primaryColor } from '../styling/variables'

import styles from './Funding.styles'

const useStyles = makeStyles(styles)

const formatAddress = (address = '') => {
  return address.replace(/(.{4})/g, '$1 ')
}

const sumReducer = (acc, value) => acc.plus(value)

const formatNumber = it => {
  return new BigNumber(it).toFormat(2)
}

const getConfirmedTotal = list => {
  return formatNumber(
    list.map(it => new BigNumber(it.fiatConfirmedBalance)).reduce(sumReducer, new BigNumber(0))
  )
}

const getPendingTotal = list => {
  return formatNumber(
    list.map(it => new BigNumber(it.fiatPending)).reduce(sumReducer, new BigNumber(0))
  )
}

const Funding = () => {
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState(null)
  const classes = useStyles()

  const isSelected = it => {
    return selected && selected.cryptoCode === it.cryptoCode
  }

  useAxios({
    url: 'http://localhost:8070/api/funding',
    method: 'GET',
    trigger: [],
    customHandler: (err, res) => {
      if (err) return
      if (res) {
        setData(res.data)
        setSelected(res.data && res.data[0])
      }
    }
  })

  return (
    <>
      <Title>Funding</Title>
      <div className={classes.wrapper}>
        <Sidebar
          data={data}
          isSelected={isSelected}
          onClick={setSelected}
          displayName={it => it.display}
        >
          {data && data.length && (
            <div className={classes.total}>
              <Info3 className={classes.totalTitle}>Total Crypto Balance</Info3>
              <Info1 className={classes.noMargin}>
                {getConfirmedTotal(data)} {data[0].fiatCode}
              </Info1>
              <Info4>(+{getPendingTotal(data)} pending)</Info4>
            </div>
          )}
        </Sidebar>
        {selected && (
          <div className={classes.main}>
            <div className={classes.firstSide}>
              <H3>Balance ({selected.display})</H3>
              <div className={classes.coinTotal}>
                <span className='info1'>
                  {`${selected.confirmedBalance} ${selected.cryptoCode}`}
                </span>
                <span className={classnames('tl2', classes.leftSpacer)}>
                  {` (+ ${selected.pending} pending)`}
                </span>
              </div>

              <div className={classes.coinTotal}>
                <span className={classnames('info3', classes.noMarginTop)}>
                  {`= ${formatNumber(selected.fiatConfirmedBalance)} ${selected.fiatCode}`}
                </span>
                <span className={classnames('info4', classes.leftSpacer)}>
                  {`(+${formatNumber(selected.fiatPending)} pending)`}
                </span>
              </div>

              <H3 className={classes.topSpacer}>Address</H3>
              <div className={classes.addressWrapper}>
                <Mono className={classes.address}>
                  <strong>{formatAddress(selected.fundingAddress)}</strong>
                </Mono>
              </div>
            </div>

            <div className={classes.secondSide}>
              <Info3>Scan to send {selected.display}</Info3>
              <QRCode size={240} fgColor={primaryColor} value={selected.fundingAddressUrl} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Funding
