import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import gql from 'graphql-tag'
import React from 'react'

import { MainStatus } from 'src/components/Status'
import { ActionButton } from 'src/components/buttons'
import DataTable from 'src/components/tables/DataTable'
import { H3, Label1 } from 'src/components/typography'
import { ReactComponent as AuthorizeReversedIcon } from 'src/styling/icons/button/authorize/white.svg'
import { ReactComponent as AuthorizeIcon } from 'src/styling/icons/button/authorize/zodiac.svg'
import { ReactComponent as RejectReversedIcon } from 'src/styling/icons/button/cancel/white.svg'
import { ReactComponent as RejectIcon } from 'src/styling/icons/button/cancel/zodiac.svg'
import { white, disabledColor } from 'src/styling/variables'
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

  const tableElements = [
    {
      name: 'customRequestName',
      header: (
        <Label1 className={classes.white}>{'Custom Request Name'}</Label1>
      ),
      width: 250,
      textAlign: 'left',
      size: 'sm',
      view: it => {
        return <div>{it.customInfoRequest.customRequest.name}</div>
      }
    },
    {
      name: 'customRequestData',
      header: (
        <Label1 className={classes.white}>{'Custom Request Data'}</Label1>
      ),
      width: 500,
      textAlign: 'left',
      size: 'sm',
      view: it => <div>{JSON.stringify(it.customerData.data, null, 2)}</div>
    },
    {
      name: 'authorized',
      header: <Label1 className={classes.white}>{'Authorized'}</Label1>,
      width: 200,
      textAlign: 'left',
      size: 'sm',
      view: it => {
        return <MainStatus statuses={[getAuthorizedStatus(it)]} />
      }
    },
    {
      name: 'actions',
      header: <Label1 className={classes.white}>{'Actions'}</Label1>,
      width: 250,
      textAlign: 'center',
      size: 'sm',
      view: it => {
        return <div className={classes.flex}>{getActionButtons(it)}</div>
      }
    }
  ]
  return (
    <>
      <H3>Custom Info Requests Data</H3>
      <DataTable
        data={data}
        elements={tableElements}
        emptyText="No custom information requests so far"
        name="customInfoRequestsData"
      />
    </>
  )
}

export default CustomInfoRequestsData
