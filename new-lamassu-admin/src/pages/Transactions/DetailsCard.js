import { makeStyles } from '@material-ui/core/styles'
import BigNumber from 'bignumber.js'
import classnames from 'classnames'
import moment from 'moment'
import React, { memo } from 'react'

import { IDButton } from 'src/components/buttons'
import { ReactComponent as CardIdInverseIcon } from 'src/styling/icons/ID/card/white.svg'
import { ReactComponent as CardIdIcon } from 'src/styling/icons/ID/card/zodiac.svg'
import { ReactComponent as PhoneIdInverseIcon } from 'src/styling/icons/ID/phone/white.svg'
import { ReactComponent as PhoneIdIcon } from 'src/styling/icons/ID/phone/zodiac.svg'
import { ReactComponent as CamIdInverseIcon } from 'src/styling/icons/ID/photo/white.svg'
import { ReactComponent as CamIdIcon } from 'src/styling/icons/ID/photo/zodiac.svg'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { toUnit } from 'src/utils/coin'
import { onlyFirstToUpper } from 'src/utils/string'

import CopyToClipboard from './CopyToClipboard'
import { detailsRowStyles, labelStyles } from './Transactions.styles'

const Label = ({ children }) => {
  const useStyles = makeStyles(labelStyles)

  const classes = useStyles()

  return <div className={classes.label}>{children}</div>
}

const DetailsRow = ({ it: tx, ...props }) => {
  const useStyles = makeStyles(detailsRowStyles)

  const classes = useStyles()

  const addr = tx.toAddress
  const txHash = tx.txHash
  const fiat = Number.parseFloat(tx.fiat)
  const crypto = toUnit(new BigNumber(tx.cryptoAtoms), tx.cryptoCode).toFormat(
    5
  )
  const commissionPercentage = Number.parseFloat(tx.commissionPercentage, 2)
  const commission =
    tx.txClass === 'cashOut'
      ? fiat * commissionPercentage
      : fiat * commissionPercentage + Number.parseFloat(tx.fee)
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

  const formatAddress = (address = '') => {
    return address.replace(/(.{5})/g, '$1 ')
  }

  return (
    <>
      <div className={classes.wrapper}>
        <div className={classnames(classes.row)}>
          <div className={classnames(classes.col, classes.col1)}>
            {/* Column 1 */}
            <div className={classes.innerRow}>
              <div>
                <Label>Direction</Label>
                <div>
                  <span className={classes.txIcon}>
                    {tx.txClass === 'cashOut' ? <TxOutIcon /> : <TxInIcon />}
                  </span>
                  <span>
                    {tx.txClass === 'cashOut' ? 'Cash-out' : 'Cash-in'}
                  </span>
                </div>
              </div>
              <div className={classes.availableIds}>
                <Label>Available IDs</Label>
                <div>
                  {tx.customerPhone && (
                    <IDButton
                      name="phone"
                      Icon={PhoneIdIcon}
                      InverseIcon={PhoneIdInverseIcon}>
                      {tx.customerPhone}
                    </IDButton>
                  )}
                  {tx.customerIdCardPhotoPath && !tx.customerIdCardData && (
                    <IDButton
                      name="card"
                      Icon={CardIdIcon}
                      InverseIcon={CardIdInverseIcon}>
                      <img alt="" src={tx.customerIdCardPhotoPath} />
                    </IDButton>
                  )}
                  {tx.customerIdCardData && (
                    <IDButton
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
                            <Label>Gender</Label>
                            <div />
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
                      <img alt="" src={tx.customerFrontCameraPath} />
                    </IDButton>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className={classnames(classes.col, classes.col2)}>
            {/* Column 2 */}
            <div className={classes.innerRow}>
              <div>
                <Label>Exchange rate</Label>
                <div>
                  {`1 ${tx.cryptoCode} = ${Number(fiat / crypto).toFixed(3)} ${
                    tx.fiatCode
                  }`}
                </div>
              </div>
              <div className={classes.commissionWrapper}>
                <Label>Commission</Label>
                <div>
                  {`${commission} ${tx.fiatCode} (${commissionPercentage *
                    100} %)`}
                </div>
              </div>
            </div>
          </div>
          <div className={classnames(classes.col, classes.col3)}>
            {/* Column 3 */}
            <div className={classnames(classes.innerRow)}>
              <div style={{ height: 43.4 }}>{/* Export to PDF */}</div>
            </div>
          </div>
        </div>
        <div className={classnames(classes.row)}>
          <div className={classnames(classes.col, classes.col1)}>
            {/* Column 1 */}
            <div className={classes.innerRow}>
              <div>
                <Label>BTC address</Label>
                <div>
                  <CopyToClipboard className={classes.cryptoAddr}>
                    {formatAddress(addr)}
                  </CopyToClipboard>
                </div>
              </div>
            </div>
          </div>
          <div className={classnames(classes.col, classes.col2)}>
            {/* Column 2 */}
            <div className={classes.innerRow}>
              <div>
                <Label>Transaction ID</Label>
                <div>
                  <CopyToClipboard className={classes.txId}>
                    {txHash}
                  </CopyToClipboard>
                </div>
              </div>
            </div>
          </div>
          <div className={classnames(classes.col, classes.col3)}>
            {/* Column 3 */}
            <div className={classes.innerRow}>
              <div>
                <Label>Session ID</Label>
                <CopyToClipboard className={classes.sessionId}>
                  {tx.id}
                </CopyToClipboard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default memo(DetailsRow, (prev, next) => prev.id === next.id)
