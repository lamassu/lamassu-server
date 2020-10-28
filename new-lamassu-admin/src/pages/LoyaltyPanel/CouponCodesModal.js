import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import Tooltip from 'src/components/Tooltip'
import { Button } from 'src/components/buttons'
import { TextInput, NumberInput } from 'src/components/inputs/base'
import { H1, H3, TL1, P } from 'src/components/typography'

import styles from './CouponCodes.styles'

const useStyles = makeStyles(styles)

const CouponCodesModal = ({ showModal, toggleModal, addCoupon }) => {
  const classes = useStyles()

  const [codeField, setCodeField] = useState('')
  const [discountField, setDiscountField] = useState('')
  const [invalidCode, setInvalidCode] = useState(false)
  const [invalidDiscount, setInvalidDiscount] = useState(false)

  const handleCodeChange = event => {
    if (event.target.value === '') {
      setInvalidCode(false)
    }
    setCodeField(event.target.value)
  }

  const handleDiscountChange = event => {
    if (event.target.value === '') {
      setInvalidDiscount(false)
    }
    setDiscountField(event.target.value)
  }

  const handleClose = () => {
    setCodeField('')
    setDiscountField('')
    setInvalidCode(false)
    setInvalidDiscount(false)
    toggleModal()
  }

  const handleAddCoupon = () => {
    if (codeField.trim() === '') {
      setInvalidCode(true)
      return
    }
    if (!validDiscount(discountField)) {
      setInvalidDiscount(true)
      return
    }
    if (codeField.trim() !== '' && validDiscount(discountField)) {
      addCoupon(R.toUpper(codeField.trim()), parseInt(discountField))
      handleClose()
    }
  }

  const validDiscount = discount => {
    const parsedDiscount = parseInt(discount)
    return parsedDiscount >= 0 && parsedDiscount <= 100
  }

  return (
    <>
      {showModal && (
        <Modal
          closeOnBackdropClick={true}
          width={600}
          height={500}
          handleClose={handleClose}
          open={true}>
          <H1 className={classes.modalTitle}>Add coupon code discount</H1>
          <H3 className={classes.modalLabel1}>Coupon code name</H3>
          <TextInput
            error={invalidCode}
            name="coupon-code"
            autoFocus
            id="coupon-code"
            type="text"
            size="lg"
            width={338}
            onChange={handleCodeChange}
            value={codeField}
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />
          <div className={classes.modalLabel2Wrapper}>
            <H3 className={classes.modalLabel2}>Define discount rate</H3>
            <Tooltip width={304}>
              <P>
                The discount rate inserted will be applied to the commissions of
                all transactions performed with this respective coupon code.
              </P>
              <P>
                (It should be a number between 0 (zero) and 100 (one hundred)).
              </P>
            </Tooltip>
          </div>
          <div className={classes.discountInput}>
            <NumberInput
              error={invalidDiscount}
              name="coupon-discount"
              id="coupon-discount"
              size="lg"
              width={50}
              onChange={handleDiscountChange}
              value={discountField}
              decimalScale={0}
              className={classes.discountInputField}
            />
            <TL1 inline className={classes.inputLabel}>
              %
            </TL1>
          </div>
          <div className={classes.footer}>
            <Button onClick={handleAddCoupon}>Add coupon</Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default CouponCodesModal
