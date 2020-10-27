import { makeStyles, Box } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import moment from 'moment'
import React, { memo } from 'react'

import { IDButton } from 'src/components/buttons'
import { Label1 } from 'src/components/typography'
import { ReactComponent as CardIdInverseIcon } from 'src/styling/icons/ID/card/white.svg'
import { ReactComponent as CardIdIcon } from 'src/styling/icons/ID/card/zodiac.svg'
import { ReactComponent as PhoneIdInverseIcon } from 'src/styling/icons/ID/phone/white.svg'
import { ReactComponent as PhoneIdIcon } from 'src/styling/icons/ID/phone/zodiac.svg'
import { ReactComponent as CamIdInverseIcon } from 'src/styling/icons/ID/photo/white.svg'
import { ReactComponent as CamIdIcon } from 'src/styling/icons/ID/photo/zodiac.svg'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { URI } from 'src/utils/apollo'
import { toUnit, formatCryptoAddress } from 'src/utils/coin'
import { onlyFirstToUpper } from 'src/utils/string'

import CopyToClipboard from './CopyToClipboard'
import styles from './DetailsCard.styles'
import { getStatus } from './helper'

const useStyles = makeStyles(styles)

const formatAddress = (cryptoCode = '', address = '') =>
  formatCryptoAddress(cryptoCode, address).replace(/(.{5})/g, '$1 ')

const Label = ({ children }) => {
  const classes = useStyles()
  return <Label1 className={classes.label}>{children}</Label1>
}

const DetailsRow = ({ it: tx }) => {
  const classes = useStyles()

  const fiat = Number.parseFloat(tx.fiat)
  const crypto = toUnit(new BigNumber(tx.cryptoAtoms), tx.cryptoCode)
  const commissionPercentage = Number.parseFloat(tx.commissionPercentage, 2)
  const commission = Number(fiat * commissionPercentage).toFixed(2)
  const exchangeRate = Number(fiat / crypto).toFixed(3)
  const displayExRate = `1 ${tx.cryptoCode} = ${exchangeRate} ${tx.fiatCode}`

  const customer = tx.customerIdCardData && {
    name: `${onlyFirstToUpper(
      tx.customerIdCardData.firstName
    )} ${onlyFirstToUpper(tx.customerIdCardData.lastName)}`,
    age: moment().diff(moment(tx.customerIdCardData.dateOfBirth), 'years'),
    country: tx.customerIdCardData.country,
    idCardNumber: tx.customerIdCardData.documentNumber,
    idCardExpirationDate: moment(tx.customerIdCardData.expirationDate).format(
      'DD-MM-YYYY'
    )
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.row}>
        <div className={classes.direction}>
          <Label>Direction</Label>
          <div>
            <span className={classes.txIcon}>
              {tx.txClass === 'cashOut' ? <TxOutIcon /> : <TxInIcon />}
            </span>
            <span>{tx.txClass === 'cashOut' ? 'Cash-out' : 'Cash-in'}</span>
          </div>
        </div>

        <div className={classes.availableIds}>
          <Label>Available IDs</Label>
          <Box display="flex" flexDirection="row">
            {tx.customerPhone && (
              <IDButton
                className={classes.idButton}
                name="phone"
                Icon={PhoneIdIcon}
                InverseIcon={PhoneIdInverseIcon}>
                {tx.customerPhone}
              </IDButton>
            )}
            {tx.customerIdCardPhotoPath && !tx.customerIdCardData && (
              <IDButton
                popoverClassname={classes.popover}
                className={classes.idButton}
                name="card"
                Icon={CardIdIcon}
                InverseIcon={CardIdInverseIcon}>
                <img
                  className={classes.idCardPhoto}
                  src={`${URI}/id-card-photo/${tx.customerIdCardPhotoPath}`}
                  alt=""
                />
              </IDButton>
            )}
            {tx.customerIdCardData && (
              <IDButton
                className={classes.idButton}
                name="card"
                Icon={CardIdIcon}
                InverseIcon={CardIdInverseIcon}>
                <div className={classes.idCardDataCard}>
                  <div>
                    <div>
                      <Label>Name</Label>
                      <div>{customer.name}</div>
                    </div>
                    <div>
                      <Label>Age</Label>
                      <div>{customer.age}</div>
                    </div>
                    <div>
                      <Label>Country</Label>
                      <div>{customer.country}</div>
                    </div>
                  </div>
                  <div>
                    <div>
                      <Label>ID number</Label>
                      <div>{customer.idCardNumber}</div>
                    </div>
                    <div>
                      <Label>Expiration date</Label>
                      <div>{customer.idCardExpirationDate}</div>
                    </div>
                  </div>
                </div>
              </IDButton>
            )}
            {tx.customerFrontCameraPath && (
              <IDButton
                name="cam"
                Icon={CamIdIcon}
                InverseIcon={CamIdInverseIcon}>
                <img
                  src={`${URI}/front-camera-photo/${tx.customerFrontCameraPath}`}
                  alt=""
                />
              </IDButton>
            )}
          </Box>
        </div>
        <div className={classes.exchangeRate}>
          <Label>Exchange rate</Label>
          <div>{crypto > 0 ? displayExRate : '-'}</div>
        </div>
        <div className={classes.commission}>
          <Label>Commission</Label>
          <div>
            {`${commission} ${tx.fiatCode} (${commissionPercentage * 100} %)`}
          </div>
        </div>
        <div>
          <Label>Fixed fee</Label>
          <div>
            {tx.txClass === 'cashIn'
              ? `${Number.parseFloat(tx.cashInFee)} ${tx.fiatCode}`
              : 'N/A'}
          </div>
        </div>
      </div>
      <div className={classes.secondRow}>
        <div className={classes.address}>
          <Label>Address</Label>
          <div>
            <CopyToClipboard>
              {formatAddress(tx.cryptoCode, tx.toAddress)}
            </CopyToClipboard>
          </div>
        </div>
        <div className={classes.transactionId}>
          <Label>Transaction ID</Label>
          <div>
            {tx.txClass === 'cashOut' ? (
              'N/A'
            ) : (
              <CopyToClipboard>{tx.txHash}</CopyToClipboard>
            )}
          </div>
        </div>
        <div className={classes.sessionId}>
          <Label>Session ID</Label>
          <CopyToClipboard>{tx.id}</CopyToClipboard>
        </div>
      </div>
      <div className={classes.lastRow}>
        <div>
          <Label>Transaction status</Label>
          <span className={classes.bold}>{getStatus(tx)}</span>
        </div>
      </div>
    </div>
  )
}

export default memo(DetailsRow, (prev, next) => prev.id === next.id)
