import React, { useState } from 'react'
import classnames from 'classnames'
import QRCode from 'qrcode.react'
import BigNumber from 'bignumber.js'
import useAxios from '@use-hooks/axios'
import { makeStyles } from '@material-ui/core/styles'

import { H3, Info1, Info2, Info3, Mono, Label1, Label3, TL2 } from '../components/typography'
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

  const itemRender = (it) => {
    return (
      <div className={classes.itemWrapper}>
        <div className={classes.firstItem}>{it.display}</div>
        <div className={classes.item}>{it.fiatConfirmedBalance} {it.fiatCode}</div>
        <div className={classes.item}>{it.confirmedBalance} {it.cryptoCode}</div>
      </div>
    )
  }

  return (
    <>
      <Title>Funding</Title>
      <div className={classes.wrapper}>
        <Sidebar
          data={data}
          isSelected={isSelected}
          onClick={setSelected}
          displayName={it => it.display}
          itemRender={itemRender}
        >
          {data && data.length && (
            <div className={classes.total}>
              <Label1 className={classes.totalTitle}>Total Crypto Balance</Label1>
              <Info1 className={classes.noMargin}>
                {getConfirmedTotal(data)} {data[0].fiatCode}
              </Info1>
              <Label1 className={classes.totalPending}>(+{getPendingTotal(data)} pending)</Label1>
            </div>
          )}
        </Sidebar>
        {selected && (
          <div className={classes.main}>
            <div className={classes.firstSide}>
              <H3>Balance ({selected.display})</H3>
              <div className={classes.coinTotal}>
                <Info1 inline noMargin>
                  {`${selected.confirmedBalance} ${selected.cryptoCode}`}
                </Info1>
                <Info2 inline noMargin className={classes.leftSpacer}>
                  {`(+ ${selected.pending} pending)`}
                </Info2>
              </div>

              <div className={classes.coinTotal}>
                <Info3 inline noMargin>
                  {`= ${formatNumber(selected.fiatConfirmedBalance)} ${selected.fiatCode}`}
                </Info3>
                <Label3 inline noMargin className={classes.leftSpacer}>
                  {`(+${formatNumber(selected.fiatPending)} pending)`}
                </Label3>
              </div>

              <H3 className={classes.topSpacer}>Address</H3>
              <div className={classes.addressWrapper}>
                <Mono className={classes.address}>
                  <strong>{formatAddress(selected.fundingAddress)}</strong>
                </Mono>
              </div>
            </div>

            <div className={classes.secondSide}>
              <Label1>Scan to send {selected.display}</Label1>
              <QRCode size={240} fgColor={primaryColor} value={selected.fundingAddressUrl} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Funding
