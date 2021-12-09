import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import gql from 'graphql-tag'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { MainStatus } from 'src/components/Status'
import { ActionButton } from 'src/components/buttons'
import {
  Table,
  THead,
  Th,
  Tr,
  Td,
  TBody
} from 'src/components/fake-table/Table'
import { H3, Label1 } from 'src/components/typography'
import { ReactComponent as AuthorizeReversedIcon } from 'src/styling/icons/button/authorize/white.svg'
import { ReactComponent as AuthorizeIcon } from 'src/styling/icons/button/authorize/zodiac.svg'
import { ReactComponent as RejectReversedIcon } from 'src/styling/icons/button/cancel/white.svg'
import { ReactComponent as RejectIcon } from 'src/styling/icons/button/cancel/zodiac.svg'
import { ReactComponent as LinkIcon } from 'src/styling/icons/month arrows/right.svg'
import { white, disabledColor } from 'src/styling/variables'

import DetailsCard from '../../Triggers/CustomInfoRequests/DetailsCard'
const styles = {
  white: {
    color: white
  },
  actionButton: {
    display: 'flex',
    height: 28,
    marginRight: 'auto'
  },
  flex: {
    display: 'flex'
  },
  disabledBtn: {
    backgroundColor: disabledColor,
    '&:hover': {
      backgroundColor: disabledColor
    }
  },
  linkIcon: {
    marginTop: 12,
    marginLeft: 4,
    cursor: 'pointer'
  }
}

const SET_AUTHORIZED_REQUEST = gql`
  mutation setAuthorizedCustomRequest(
    $customerId: ID!
    $infoRequestId: ID!
    $isAuthorized: Boolean!
  ) {
    setAuthorizedCustomRequest(
      customerId: $customerId
      infoRequestId: $infoRequestId
      isAuthorized: $isAuthorized
    )
  }
`

const useStyles = makeStyles(styles)
const CustomInfoRequestsData = ({ data }) => {
  const classes = useStyles()
  const [toView, setToView] = useState(null)
  const [setAuthorized] = useMutation(SET_AUTHORIZED_REQUEST, {
    onError: () => console.error('Error while clearing notification'),
    refetchQueries: () => ['customer']
  })

  const authorize = it =>
    setAuthorized({
      variables: {
        customerId: it.customerId,
        infoRequestId: it.customInfoRequest.id,
        isAuthorized: true
      }
    })

  const reject = it =>
    setAuthorized({
      variables: {
        customerId: it.customerId,
        infoRequestId: it.customInfoRequest.id,
        isAuthorized: false
      }
    })

  const getBtnClasses = (it, isAuthorize) => {
    return {
      [classes.actionButton]: true,
      [classes.disabledBtn]:
        (isAuthorize && it.approved === true) ||
        (!isAuthorize && it.approved === false)
    }
  }

  const AuthorizeButton = it => (
    <ActionButton
      className={classnames(getBtnClasses(it, true))}
      color="secondary"
      Icon={AuthorizeIcon}
      InverseIcon={AuthorizeReversedIcon}
      onClick={() => authorize(it)}>
      Authorize
    </ActionButton>
  )

  const RejectButton = it => (
    <ActionButton
      className={classnames(getBtnClasses(it, false))}
      color="secondary"
      Icon={RejectIcon}
      InverseIcon={RejectReversedIcon}
      onClick={() => reject(it)}>
      Reject
    </ActionButton>
  )

  const getActionButtons = it => {
    return (
      <>
        {AuthorizeButton(it)}
        {RejectButton(it)}
      </>
    )
  }

  const getAuthorizedStatus = it => {
    return it.approved === null
      ? { label: 'Pending', type: 'neutral' }
      : it.approved === false
      ? { label: 'Rejected', type: 'error' }
      : { label: 'Accepted', type: 'success' }
  }

  return (
    <>
      <H3>Custom Info Requests Data</H3>
      <div>
        <Table>
          <THead>
            <Th width={250}>Custom Request Name</Th>
            <Th width={500}>Custom Request Data</Th>
            <Th width={200}>Status</Th>
            <Th width={250} textAlign="center">
              Actions
            </Th>
          </THead>
          <TBody>
            {data.map((it, idx) => (
              <React.Fragment key={idx}>
                <Tr>
                  <Td size="sm" width={250}>
                    <div className={classes.flex}>
                      <Label1>{it.customInfoRequest.customRequest.name}</Label1>
                      <div onClick={() => setToView(it)}>
                        <LinkIcon className={classes.linkIcon} />
                      </div>
                    </div>
                  </Td>
                  <Td size="sm" width={500}>
                    <div>{JSON.stringify(it.customerData.data, null, 2)}</div>
                  </Td>
                  <Td size="sm" width={200}>
                    <MainStatus statuses={[getAuthorizedStatus(it)]} />
                  </Td>
                  <Td size="sm" width={250}>
                    <div className={classes.flex}>{getActionButtons(it)}</div>
                  </Td>
                </Tr>
              </React.Fragment>
            ))}
          </TBody>
        </Table>
        {toView && (
          <Modal
            width={900}
            height={400}
            open={true}
            handleClose={() => setToView(null)}>
            <H3>Custom Information Request Details</H3>
            <DetailsCard it={{ ...toView.customInfoRequest }} />
          </Modal>
        )}
      </div>
    </>
  )
}

export default CustomInfoRequestsData
