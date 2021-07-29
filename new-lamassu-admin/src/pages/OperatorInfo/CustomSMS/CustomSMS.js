import { useQuery } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Link, IconButton } from 'src/components/buttons'
import DataTable from 'src/components/tables/DataTable'
import { H4 } from 'src/components/typography'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'

import { global } from '../OperatorInfo.styles'

import CustomSMSModal from './CustomSMSModal'

const useStyles = makeStyles(global)

const GET_CUSTOM_MESSAGES = gql`
  query customMessages {
    customMessages {
      id
      event
      deviceId
      message
    }
  }
`

const GET_MACHINES = gql`
  {
    machines {
      name
      deviceId
    }
  }
`

const CustomSMS = () => {
  const classes = useStyles()

  const [showModal, setShowModal] = useState(false)
  const { data: messagesData, loading: messagesLoading } = useQuery(
    GET_CUSTOM_MESSAGES
  )
  const { data: machinesData, loading: machinesLoading } = useQuery(
    GET_MACHINES
  )

  const loading = messagesLoading && machinesLoading

  const machineOptions =
    machinesData &&
    R.map(
      it => ({ code: it.deviceId, display: it.name }),
      R.path(['machines'])(machinesData)
    )

  const elements = [
    {
      header: 'Message name',
      width: 400,
      size: 'sm',
      textAlign: 'left',
      view: it => it.event
    },
    {
      header: 'Edit',
      width: 120,
      size: 'sm',
      textAlign: 'center',
      view: it => (
        <IconButton
          onClick={() => {
            console.log('edit')
          }}>
          <EditIcon />
        </IconButton>
      )
    },
    {
      header: 'Delete',
      width: 120,
      size: 'sm',
      textAlign: 'center',
      view: it => (
        <IconButton
          onClick={() => {
            console.log('delete')
          }}>
          <DeleteIcon />
        </IconButton>
      )
    }
  ]

  return (
    <>
      <div className={classes.headerWithLink}>
        <H4>Custom SMS message</H4>
        <Box
          className={classes.tableWidth}
          display="flex"
          justifyContent="flex-end">
          <Link color="primary" onClick={() => setShowModal(true)}>
            Add custom SMS
          </Link>
        </Box>
      </div>
      {showModal && (
        <CustomSMSModal
          showModal={showModal}
          onClose={() => setShowModal(false)}
          machineOptions={machineOptions}
        />
      )}
      <DataTable
        emptyText="No custom SMS so far"
        elements={elements}
        loading={loading}
        data={R.path(['customMessages'])(messagesData)}
      />
    </>
  )
}

export default CustomSMS
