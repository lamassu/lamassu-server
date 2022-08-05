import { useQuery } from '@apollo/react-hooks'
import { utils as coinUtils } from '@lamassu/coins'
import { makeStyles } from '@material-ui/core/styles'
import BigNumber from 'bignumber.js'
import classnames from 'classnames'
import gql from 'graphql-tag'
import QRCode from 'qrcode.react'
import * as R from 'ramda'
import React, { useState } from 'react'

import Title from 'src/components/Title'
import Sidebar from 'src/components/layout/Sidebar'
import DataTable from 'src/components/tables/DataTable'
import {
  H3,
  H4,
  Info1,
  Info2,
  Info3,
  Label1,
  Label3
} from 'src/components/typography'
import CopyToClipboard from 'src/pages/Transactions/CopyToClipboard'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { primaryColor } from 'src/styling/variables'
import { fromNamespace, namespaces } from 'src/utils/config'
import { onlyFirstToUpper } from 'src/utils/string'
import { formatDate } from 'src/utils/timezones'

import styles from './Funding.styles'

const NODE_NOT_CONNECTED_ERR =
  "Couldn't establish connection with the node. Make sure it is installed and try again"

const useStyles = makeStyles(styles)

const GET_FUNDING = gql`
  {
    config
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
      walletHistory
    }
  }
`

const formatAddress = (cryptoCode = '', address = '') =>
  coinUtils.formatCryptoAddress(cryptoCode, address).replace(/(.{4})/g, '$1 ')
const sumReducer = (acc, value) => acc.plus(value)
const formatNumber = (it, decimals = 2) => new BigNumber(it).toFormat(decimals)

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
  const classes = useStyles()

  const isSelected = it => {
    return selected && selected.cryptoCode === it.cryptoCode
  }

  const { data: fundingResponse, loading } = useQuery(GET_FUNDING)
  const funding = R.path(['funding'])(fundingResponse) ?? []
  const config = R.path(['config'])(fundingResponse) ?? {}

  const timezone = fromNamespace(namespaces.LOCALE)(config).timezone

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

  const elements = [
    {
      header: 'Operation',
      width: 215,
      size: 'sm',
      className: classes.operationLabel,
      view: it => {
        switch (it.operation) {
          case 'cash-in':
            return (
              <>
                <TxInIcon />
                <span>Cash-in transaction</span>
              </>
            )
          case 'cash-out':
            return (
              <>
                <TxOutIcon /> <span>Cash-out transaction</span>
              </>
            )
          default:
            return onlyFirstToUpper(it.operation)
        }
      }
    },
    {
      header: 'Crypto',
      width: 165,
      size: 'sm',
      textAlign: 'right',
      view: it => `${formatNumber(it.amount, 5)} ${selected.cryptoCode}`
    },
    {
      header: 'Cash value (current)',
      width: 195,
      size: 'sm',
      textAlign: 'right',
      view: it => `${formatNumber(it.fiatValue)} ${funding[0].fiatCode}`
    },
    {
      header: 'Address',
      width: 180,
      size: 'sm',
      className: classes.historyAddress,
      view: it => it.address
    },
    {
      header: 'Date',
      width: 180,
      size: 'sm',
      textAlign: 'right',
      view: it =>
        timezone && formatDate(it.created, timezone, 'yyyy-MM-dd HH:mm')
    }
  ]

  const pendingTotal = getPendingTotal(funding)
  const signIfPositive = num => (num >= 0 ? '+' : '')

  return (
    <>
      <Title>Funding</Title>
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
                {`${getConfirmedTotal(funding)} ${funding[0].fiatCode}`}
              </Info1>
              <Label1 className={classes.totalPending}>
                ({signIfPositive(pendingTotal)} {pendingTotal} pending)
              </Label1>
            </div>
          )}
        </Sidebar>
        {selected && selected.errorMsg && (
          <div className={classes.main}>
            <div className={classes.firstSide}>
              <Info3 className={classes.error}>
                {R.includes('ECONNREFUSED', selected.errorMsg)
                  ? NODE_NOT_CONNECTED_ERR
                  : selected.errorMsg}
              </Info3>
            </div>
          </div>
        )}
        {selected && !selected.errorMsg && (
          <div className={classes.mainWrapper}>
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
                      <CopyToClipboard
                        buttonClassname={classes.copyToClipboard}
                        key={selected.cryptoCode}>
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
            <div className={classes.walletHistory}>
              <H4>Wallet history</H4>
              <DataTable
                loading={loading}
                emptyText="No transactions so far"
                elements={elements}
                data={R.path(['walletHistory'], selected)}
                rowSize="sm"
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Funding
