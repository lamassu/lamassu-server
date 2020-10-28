import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Link, Button, IconButton } from 'src/components/buttons'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'
import { H2, TL1 } from 'src/components/typography'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'

import styles from './CouponCodes.styles'
import CouponCodesModal from './CouponCodesModal'

const useStyles = makeStyles(styles)

const GET_COUPONS = gql`
  query coupons {
    coupons {
      id
      code
      discount
      soft_deleted
    }
  }
`

const SOFT_DELETE_COUPON = gql`
  mutation softDeleteCoupon($couponId: ID!) {
    softDeleteCoupon(couponId: $couponId) {
      id
    }
  }
`

const CREATE_COUPON = gql`
  mutation createCoupon($code: String!, $discount: Int!) {
    createCoupon(code: $code, discount: $discount) {
      id
      code
      discount
      soft_deleted
    }
  }
`

const Coupons = () => {
  const classes = useStyles()

  const [showModal, setShowModal] = useState(false)
  const toggleModal = () => setShowModal(!showModal)

  const { data: couponResponse, loading } = useQuery(GET_COUPONS)

  const [softDeleteCoupon] = useMutation(SOFT_DELETE_COUPON, {
    refetchQueries: () => ['coupons']
  })

  const [createCoupon] = useMutation(CREATE_COUPON, {
    refetchQueries: () => ['coupons']
  })

  const addCoupon = (code, discount) => {
    createCoupon({ variables: { code: code, discount: discount } })
  }

  const elements = [
    {
      header: 'Coupon Code',
      width: 300,
      textAlign: 'left',
      size: 'sm',
      view: t => t.code
    },
    {
      header: 'Discount',
      width: 220,
      textAlign: 'left',
      size: 'sm',
      view: t => (
        <>
          <TL1 inline>{t.discount}</TL1> % in commissions
        </>
      )
    },
    {
      header: 'Delete',
      width: 100,
      textAlign: 'center',
      size: 'sm',
      view: t => (
        <IconButton
          onClick={() => {
            softDeleteCoupon({ variables: { couponId: t.id } })
          }}>
          <DeleteIcon />
        </IconButton>
      )
    }
  ]

  return (
    <>
      <TitleSection title="Discount Coupons"></TitleSection>
      {!loading && !R.isEmpty(couponResponse.coupons) && (
        <Box
          marginBottom={4}
          marginTop={-5}
          className={classes.tableWidth}
          display="flex"
          justifyContent="flex-end">
          <Link color="primary" onClick={toggleModal}>
            Add new coupon
          </Link>
        </Box>
      )}
      {!loading && !R.isEmpty(couponResponse.coupons) && (
        <DataTable
          elements={elements}
          data={R.path(['coupons'])(couponResponse)}
        />
      )}
      {!loading && R.isEmpty(couponResponse.coupons) && (
        <Box display="flex" alignItems="left" flexDirection="column">
          <H2>Currently, there are no active coupon codes on your network.</H2>
          <Button onClick={toggleModal}>Add coupon</Button>
        </Box>
      )}
      <CouponCodesModal
        showModal={showModal}
        toggleModal={toggleModal}
        addCoupon={addCoupon}
      />
    </>
  )
}
export default Coupons
