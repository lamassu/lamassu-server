import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Paper } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { HoverableTooltip } from 'src/components/Tooltip'
import { IconButton } from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import DataTable from 'src/components/tables/DataTable'
import { H4, P, Label3 } from 'src/components/typography'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as ExpandIconClosed } from 'src/styling/icons/action/expand/closed.svg'
import { ReactComponent as ExpandIconOpen } from 'src/styling/icons/action/expand/open.svg'
import { ReactComponent as WhiteLogo } from 'src/styling/icons/menu/logo-white.svg'
import { formatDate } from 'src/utils/timezones'

import styles from './SMSNotices.styles'
import CustomSMSModal from './SMSNoticesModal'

const useStyles = makeStyles(styles)

const GET_SMS_NOTICES = gql`
  query SMSNotices {
    SMSNotices {
      id
      event
      message
      messageName
      enabled
      allowToggle
    }
    config
  }
`

const EDIT_SMS_NOTICE = gql`
  mutation editSMSNotice($id: ID!, $event: SMSNoticeEvent!, $message: String!) {
    editSMSNotice(id: $id, event: $event, message: $message) {
      id
    }
  }
`

const ENABLE_SMS_NOTICE = gql`
  mutation enableSMSNotice($id: ID!) {
    enableSMSNotice(id: $id) {
      id
    }
  }
`

const DISABLE_SMS_NOTICE = gql`
  mutation disableSMSNotice($id: ID!) {
    disableSMSNotice(id: $id) {
      id
    }
  }
`

const multiReplace = (str, obj) => {
  var re = new RegExp(Object.keys(obj).join('|'), 'gi')

  return str.replace(re, function(matched) {
    return obj[matched.toLowerCase()]
  })
}

const formatContent = content => {
  const fragments = R.split(/\n/)(content)
  return R.map((it, idx) => {
    if (idx === fragments.length) return <>{it}</>
    return (
      <>
        {it}
        <br />
      </>
    )
  }, fragments)
}

const TOOLTIPS = {
  smsCode: ``,
  cashOutDispenseReady: ``,
  smsReceipt: formatContent(`The contents of this notice will be appended to the end of the SMS receipt sent, and not replace it.\n
  To edit the contents of the SMS receipt, please go to the 'Receipt' tab`)
}

const SMSPreview = ({ sms, coords, timezone }) => {
  const classes = useStyles(coords)

  const matches = {
    '#code': 123,
    '#timestamp': formatDate(new Date(), timezone, 'HH:mm')
  }

  return (
    <div className={classes.smsPreview}>
      <div className={classes.smsPreviewContainer}>
        <div className={classes.smsPreviewIcon}>
          <WhiteLogo width={22} height={22} />
        </div>
        <Paper className={classes.smsPreviewContent}>
          <P noMargin>
            {R.isEmpty(sms?.message) ? (
              <i>No content available</i>
            ) : (
              formatContent(multiReplace(sms?.message, matches))
            )}
          </P>
        </Paper>
        <Label3>{formatDate(new Date(), timezone, 'HH:mm')}</Label3>
      </div>
    </div>
  )
}

const SMSNotices = () => {
  const classes = useStyles()

  const [showModal, setShowModal] = useState(false)
  const [selectedSMS, setSelectedSMS] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewCoords, setPreviewCoords] = useState({ x: 0, y: 0 })
  const [errorMsg, setErrorMsg] = useState('')

  const { data: messagesData, loading: messagesLoading } = useQuery(
    GET_SMS_NOTICES
  )

  const timezone = R.path(['config', 'locale_timezone'])(messagesData)

  const [editMessage] = useMutation(EDIT_SMS_NOTICE, {
    onError: ({ msg }) => setErrorMsg(msg),
    refetchQueries: () => ['SMSNotices']
  })

  const [enableMessage] = useMutation(ENABLE_SMS_NOTICE, {
    onError: ({ msg }) => setErrorMsg(msg),
    refetchQueries: () => ['SMSNotices']
  })

  const [disableMessage] = useMutation(DISABLE_SMS_NOTICE, {
    onError: ({ msg }) => setErrorMsg(msg),
    refetchQueries: () => ['SMSNotices']
  })

  const loading = messagesLoading

  const handleClose = () => {
    setShowModal(false)
    setSelectedSMS(null)
  }

  const elements = [
    {
      header: 'Message name',
      width: 500,
      size: 'sm',
      textAlign: 'left',
      view: it =>
        !R.isEmpty(TOOLTIPS[it.event]) ? (
          <div className={classes.messageWithTooltip}>
            {R.prop('messageName', it)}
            <HoverableTooltip width={250}>
              <P>{TOOLTIPS[it.event]}</P>
            </HoverableTooltip>
          </div>
        ) : (
          R.prop('messageName', it)
        )
    },
    {
      header: 'Edit',
      width: 100,
      size: 'sm',
      textAlign: 'center',
      view: it => (
        <IconButton
          onClick={() => {
            setPreviewOpen(false)
            setSelectedSMS(it)
            setShowModal(true)
          }}>
          <EditIcon />
        </IconButton>
      )
    },
    {
      header: 'Enable',
      width: 100,
      size: 'sm',
      textAlign: 'center',
      view: it => (
        <Switch
          disabled={!it.allowToggle}
          onClick={() => {
            it.enabled
              ? disableMessage({ variables: { id: it.id } })
              : enableMessage({ variables: { id: it.id } })
          }}
          checked={it.enabled}
        />
      )
    },
    {
      header: '',
      width: 100,
      size: 'sm',
      textAlign: 'center',
      view: it => (
        <IconButton
          onClick={e => {
            setSelectedSMS(it)
            setPreviewCoords({
              x: e.currentTarget.getBoundingClientRect().right + 50,
              y:
                window.innerHeight -
                5 -
                e.currentTarget.getBoundingClientRect().bottom
            })
            R.equals(selectedSMS, it)
              ? setPreviewOpen(!previewOpen)
              : setPreviewOpen(true)
          }}>
          {R.equals(selectedSMS, it) && previewOpen ? (
            <ExpandIconOpen />
          ) : (
            <ExpandIconClosed />
          )}
        </IconButton>
      )
    }
  ]

  return (
    <>
      <div className={classes.header}>
        <H4>SMS notices</H4>
      </div>
      {showModal && (
        <CustomSMSModal
          showModal={showModal}
          onClose={handleClose}
          sms={selectedSMS}
          creationError={errorMsg}
          submit={editMessage}
        />
      )}
      {previewOpen && (
        <SMSPreview
          sms={selectedSMS}
          coords={previewCoords}
          timezone={timezone}
        />
      )}
      <DataTable
        emptyText="No SMS notices so far"
        elements={elements}
        loading={loading}
        data={R.path(['SMSNotices'])(messagesData)}
      />
    </>
  )
}

export default SMSNotices
