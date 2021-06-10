import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import BigNumber from 'bignumber.js'
import classnames from 'classnames'
import gql from 'graphql-tag'
import { utils as coinUtils } from 'lamassu-coins'
import moment from 'moment'
import QRCode from 'qrcode.react'
import * as R from 'ramda'
import React, { useState } from 'react'

import TableLabel from 'src/components/TableLabel'
import Title from 'src/components/Title'
import { Tr, Td, THead, TBody, Table } from 'src/components/fake-table/Table'
import Sidebar from 'src/components/layout/Sidebar'
import {
  H3,
  Info1,
  Info2,
  Info3,
  Label1,
  Label3
} from 'src/components/typography'
import CopyToClipboard from 'src/pages/Transactions/CopyToClipboard'
import { primaryColor } from 'src/styling/variables'

import styles from './Funding.styles'

const useStyles = makeStyles(styles)
const sizes = {
  big: 165,
  time: 140,
  date: 130
}

const GET_FUNDING = gql`
  {
    funding {
      cryptoCode
      errorMsg
      fundingAddress
      fundingAddressUrl
      confirmedBalance
      pending
      fiatConfirmedBalance
      fiatPending
      fiatCode
      display
      unitScale
    }
  }
`

const formatAddress = (cryptoCode = '', address = '') =>
  coinUtils.formatCryptoAddress(cryptoCode, address).replace(/(.{4})/g, '$1 ')
const sumReducer = (acc, value) => acc.plus(value)
const formatNumber = it => new BigNumber(it).toFormat(2)

const getConfirmedTotal = list => {
  return formatNumber(
    list
      .filter(it => !it.errorMsg)
      .map(it => new BigNumber(it.fiatConfirmedBalance))
      .reduce(sumReducer, new BigNumber(0))
  )
}

const getPendingTotal = list => {
  return formatNumber(
    list
      .filter(it => !it.errorMsg)
      .map(it => new BigNumber(it.fiatPending))
      .reduce(sumReducer, new BigNumber(0))
  )
}

const Funding = () => {
  const [selected, setSelected] = useState(null)
  const [viewHistory] = useState(false)
  const classes = useStyles()
  const fundingHistory = [
    {
      cryptoAmount: 2.0,
      balance: 10.23,
      fiatValue: 1000.0,
      date: new Date(),
      performedBy: null,
      pending: true
    },
    {
      cryptoAmount: 10.0,
      balance: 12.23,
      fiatValue: 12000.0,
      date: new Date(),
      performedBy: null
    },
    {
      cryptoAmount: 5.0,
      balance: 5.0,
      fiatValue: 50000.0,
      date: new Date(),
      performedBy: null
    }
  ]

  const isSelected = it => {
    return selected && selected.cryptoCode === it.cryptoCode
  }

  const { data: fundingResponse, loading } = useQuery(GET_FUNDING)
  const funding = R.path(['funding'])(fundingResponse) ?? []

  if (funding.length && !selected) {
    setSelected(funding[0])
  }

  const itemRender = (it, active) => {
    const itemClass = {
      [classes.item]: true,
      [classes.inactiveItem]: !active
    }
    const wrapperClass = {
      [classes.itemWrapper]: true,
      [classes.error]: it.errorMsg
    }

    return (
      <div className={classnames(wrapperClass)}>
        <div className={classes.firstItem}>{it.display}</div>
        {!it.errorMsg && (
          <>
            <div className={classnames(itemClass)}>
              {formatNumber(it.fiatConfirmedBalance)} {it.fiatCode}
            </div>
            <div className={classnames(itemClass)}>
              {it.confirmedBalance} {it.cryptoCode}
            </div>
          </>
        )}
      </div>
    )
  }

  const pendingTotal = getPendingTotal(funding)
  const signIfPositive = num => (num >= 0 ? '+' : '')

  return (
    <>
      <div>
        <Title>Funding</Title>
        {/* <button onClick={it => setViewHistory(!viewHistory)}>history</button> */}
      </div>
      <div className={classes.wrapper}>
        <Sidebar
          data={funding}
          isSelected={isSelected}
          onClick={setSelected}
          displayName={it => it.display}
          itemRender={itemRender}
          loading={loading}>
          {funding.length && (
            <div className={classes.total}>
              <Label1 className={classes.totalTitle}>
                Total Crypto Balance
              </Label1>
              <Info1 noMargin>
                {getConfirmedTotal(funding)}
                {funding[0].fiatCode}
              </Info1>
              <Label1 className={classes.totalPending}>
                ({signIfPositive(pendingTotal)} {pendingTotal} pending)
              </Label1>
            </div>
          )}
        </Sidebar>
        {selected && !viewHistory && selected.errorMsg && (
          <div className={classes.main}>
            <div className={classes.firstSide}>
              <Info3 className={classes.error}>{selected.errorMsg}</Info3>
            </div>
          </div>
        )}
        {selected && !viewHistory && !selected.errorMsg && (
          <div className={classes.main}>
            <div className={classes.firstSide}>
              <H3>Balance ({selected.display})</H3>
              <div className={classes.coinTotal}>
                <Info1 inline noMargin>
                  {`${selected.confirmedBalance} ${selected.cryptoCode}`}
                </Info1>
                <Info2 inline noMargin className={classes.leftSpacer}>
                  {`(${signIfPositive(selected.pending)} ${
                    selected.pending
                  } pending)`}
                </Info2>
              </div>

              <div className={classes.coinTotal}>
                <Info3 inline noMargin>
                  {`= ${formatNumber(selected.fiatConfirmedBalance)} ${
                    selected.fiatCode
                  }`}
                </Info3>
                <Label3 inline noMargin className={classes.leftSpacer}>
                  {`(${signIfPositive(selected.fiatPending)} ${formatNumber(
                    selected.fiatPending
                  )} pending)`}
                </Label3>
              </div>

              <H3 className={classes.topSpacer}>Address</H3>
              <div className={classes.addressWrapper}>
                <div className={classes.mono}>
                  <strong>
                    <CopyToClipboard buttonClassname={classes.copyToClipboard}>
                      {formatAddress(
                        selected.cryptoCode,
                        selected.fundingAddress
                      )}
                    </CopyToClipboard>
                  </strong>
                </div>
              </div>
            </div>

            <div className={classes.secondSide}>
              <Label1>Scan to send {selected.display}</Label1>
              <QRCode
                size={240}
                fgColor={primaryColor}
                value={selected.fundingAddressUrl}
              />
            </div>
          </div>
        )}
        {selected && viewHistory && (
          <div>
            <TableLabel
              className={classes.tableLabel}
              label="Pending"
              color="#cacaca"
            />
            <Table className={classes.table}>
              <THead>
                <Td header width={sizes.big}>
                  Amount Entered
                </Td>
                <Td header width={sizes.big}>
                  Balance After
                </Td>
                <Td header width={sizes.big}>
                  Cash Value
                </Td>
                <Td header width={sizes.date}>
                  Date
                </Td>
                <Td header width={sizes.time}>
                  Time (h:m:s)
                </Td>
                <Td header width={sizes.big}>
                  Performed By
                </Td>
              </THead>
              <TBody>
                {fundingHistory.map((it, idx) => (
                  <Tr
                    key={idx}
                    className={classnames({ [classes.pending]: it.pending })}>
                    <Td width={sizes.big}>
                      {it.cryptoAmount} {selected.cryptoCode}
                    </Td>
                    <Td width={sizes.big}>
                      {it.balance} {selected.cryptoCode}
                    </Td>
                    <Td width={sizes.big}>
                      {it.fiatValue} {selected.fiatCode}
                    </Td>
                    <Td width={sizes.date}>
                      {moment(it.date).format('YYYY-MM-DD')}
                    </Td>
                    <Td width={sizes.time}>
                      {moment(it.date).format('hh:mm:ss')}
                    </Td>
                    <Td width={sizes.big}>add</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}

export default Funding
