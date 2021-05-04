import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import React, { useState } from 'react'

import { DeleteDialog } from 'src/components/DeleteDialog'
import { IconButton, Button, Link } from 'src/components/buttons'
import DataTable from 'src/components/tables/DataTable'
import { Info1, Info3 } from 'src/components/typography'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'

import styles from './CustomInfoRequests.styles'
import DetailsRow from './DetailsCard'
import Wizard from './Wizard'
const useStyles = makeStyles(styles)

const inputTypeDisplay = {
  numerical: 'Numerical',
  text: 'Text',
  choiceList: 'Choice list'
}

const constraintTypeDisplay = {
  date: 'Date',
  none: 'None',
  email: 'Email',
  length: 'Length',
  selectOne: 'Select one',
  selectMultiple: 'Select multiple',
  spaceSeparation: 'Space separation'
}

const CustomInfoRequests = ({
  customRequests,
  showWizard,
  toggleWizard,
  handleDelete,
  handleSave
}) => {
  const classes = useStyles()
  const [toBeDeleted, setToBeDeleted] = useState()
  const [toBeEdited, setToBeEdited] = useState()
  const [deleteDialog, setDeleteDialog] = useState(false)
  return (
    <>
      {customRequests.length > 0 && (
        <DataTable
          loading={false}
          emptyText="No custom info requests so far"
          elements={[
            {
              header: 'Requirement name',
              width: 300,
              textAlign: 'left',
              size: 'sm',
              view: it => it.name
            },
            {
              header: 'Data entry type',
              width: 300,
              textAlign: 'left',
              size: 'sm',
              view: it => inputTypeDisplay[it.input.type]
            },
            {
              header: 'Constraints',
              width: 300,
              textAlign: 'left',
              size: 'sm',
              view: it => constraintTypeDisplay[it.input.constraintType]
            },
            {
              header: 'Edit',
              width: 100,
              textAlign: 'center',
              size: 'sm',
              view: it => {
                return (
                  <IconButton
                    onClick={() => {
                      setToBeEdited(it)
                      return toggleWizard()
                    }}>
                    <EditIcon />
                  </IconButton>
                )
              }
            },
            {
              header: 'Delete',
              width: 100,
              textAlign: 'center',
              size: 'sm',
              view: it => {
                return (
                  <IconButton
                    onClick={() => {
                      setToBeDeleted(it)
                      return setDeleteDialog(true)
                    }}>
                    <DeleteIcon />
                  </IconButton>
                )
              }
            }
          ]}
          data={customRequests}
          Details={DetailsRow}
          expandable
          rowSize="sm"
        />
      )}
      {!customRequests.length && (
        <div className={classes.centerItems}>
          <Info1 className={classnames(classes.m0, classes.mb10)}>
            It seems you haven't added any custom information requests yet.
          </Info1>
          <Info3 className={classnames(classes.m0, classes.mb10)}>
            Please read our{' '}
            <a href="https://support.lamassu.is/hc/en-us/sections/115000817232-Compliance">
              <Link>Support Article</Link>
            </a>{' '}
            on Compliance before adding new information requests.
          </Info3>
          <Button onClick={toggleWizard}>Add custom information request</Button>
        </div>
      )}
      {showWizard && (
        <Wizard
          onClose={() => {
            setToBeEdited(null)
            return toggleWizard()
          }}
          toBeEdited={toBeEdited}
          onSave={(...args) => {
            setToBeEdited(null)
            handleSave(...args)
            return toggleWizard()
          }}
        />
      )}

      <DeleteDialog
        open={deleteDialog}
        onDismissed={() => setDeleteDialog(false)}
        onConfirmed={() => {
          handleDelete(toBeDeleted)
          return setDeleteDialog(false)
        }}
      />
    </>
  )
}

export default CustomInfoRequests
