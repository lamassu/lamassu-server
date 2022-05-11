import { useMutation, useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { DeleteDialog } from 'src/components/DeleteDialog'
import { IconButton, Button, Link } from 'src/components/buttons'
import DataTable from 'src/components/tables/DataTable'
import { Info1, Info3, P } from 'src/components/typography'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { fromNamespace, namespaces, toNamespace } from 'src/utils/config'

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

const GET_DATA = gql`
  query getData {
    config
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const ADD_ROW = gql`
  mutation insertCustomInfoRequest($customRequest: CustomRequestInput!) {
    insertCustomInfoRequest(customRequest: $customRequest) {
      id
    }
  }
`
const EDIT_ROW = gql`
  mutation editCustomInfoRequest(
    $id: ID!
    $customRequest: CustomRequestInput!
  ) {
    editCustomInfoRequest(id: $id, customRequest: $customRequest) {
      id
    }
  }
`

const REMOVE_ROW = gql`
  mutation removeCustomInfoRequest($id: ID!) {
    removeCustomInfoRequest(id: $id) {
      id
    }
  }
`

const CustomInfoRequests = ({
  showWizard,
  toggleWizard,
  data: customRequests
}) => {
  const classes = useStyles()

  const [toBeDeleted, setToBeDeleted] = useState()
  const [toBeEdited, setToBeEdited] = useState()
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [hasError, setHasError] = useState(false)

  const { data: configData, loading: configLoading } = useQuery(GET_DATA)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData'],
    onError: () => setHasError(true)
  })

  const [addEntry] = useMutation(ADD_ROW, {
    onError: () => {
      console.log('Error while adding custom info request')
      setHasError(true)
    },
    onCompleted: () => {
      setHasError(false)
      toggleWizard()
    },
    refetchQueries: () => ['customInfoRequests']
  })

  const [editEntry] = useMutation(EDIT_ROW, {
    onError: () => {
      console.log('Error while editing custom info request')
      setHasError(true)
    },
    onCompleted: () => {
      setHasError(false)
      setToBeEdited(null)
      toggleWizard()
    },
    refetchQueries: () => ['getData', 'customInfoRequests']
  })

  const [removeEntry] = useMutation(REMOVE_ROW, {
    onError: () => {
      console.log('Error while removing custom info request')
      setHasError(true)
    },
    onCompleted: () => {
      setDeleteDialog(false)
      setHasError(false)
    },
    refetchQueries: () => ['getData', 'customInfoRequests']
  })

  const config = R.path(['config'])(configData) ?? []

  const handleDelete = id => {
    removeEntry({
      variables: {
        id
      }
    }).then(() => {
      const triggersConfig =
        (config && fromNamespace(namespaces.TRIGGERS)(config)) ?? []
      const cleanConfig = {
        overrides: R.reject(
          it => it.requirement === id,
          triggersConfig.overrides
        )
      }
      const newConfig = toNamespace(namespaces.TRIGGERS)(cleanConfig)
      saveConfig({ variables: { config: newConfig } })
    })
  }

  const handleSave = (values, isEditing) => {
    if (isEditing) {
      return editEntry({
        variables: {
          id: values.id,
          customRequest: R.omit(['id'])(values)
        }
      })
    }
    return addEntry({
      variables: {
        customRequest: {
          ...values
        }
      }
    })
  }

  const detailedDeleteMsg = (
    <>
      <P noMargin>
        Deleting this item will result in the triggers using it to be removed,
        together with the advanced trigger overrides you defined for this item.
      </P>
      <P noMargin>
        This action is <b>permanent</b>.
      </P>
    </>
  )

  return (
    !configLoading && (
      <>
        {customRequests.length > 0 && (
          <DataTable
            emptyText="No custom info requests so far"
            elements={[
              {
                header: 'Requirement name',
                width: 300,
                textAlign: 'left',
                size: 'sm',
                view: it => it.customRequest.name
              },
              {
                header: 'Data entry type',
                width: 300,
                textAlign: 'left',
                size: 'sm',
                view: it => inputTypeDisplay[it.customRequest.input.type]
              },
              {
                header: 'Constraints',
                width: 300,
                textAlign: 'left',
                size: 'sm',
                view: it =>
                  constraintTypeDisplay[it.customRequest.input.constraintType]
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
                        setToBeDeleted(it.id)
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
            <Button onClick={() => toggleWizard()}>
              Add custom information request
            </Button>
          </div>
        )}
        {showWizard && (
          <Wizard
            hasError={hasError}
            onClose={() => {
              setToBeEdited(null)
              setHasError(false)
              toggleWizard()
            }}
            toBeEdited={toBeEdited}
            onSave={(...args) => handleSave(...args)}
            existingRequirements={customRequests}
          />
        )}

        <DeleteDialog
          errorMessage={hasError ? 'Failed to delete' : ''}
          open={deleteDialog}
          onDismissed={() => {
            setDeleteDialog(false)
            setHasError(false)
          }}
          item={`custom information request`}
          extraMessage={detailedDeleteMsg}
          onConfirmed={() => handleDelete(toBeDeleted)}
        />
      </>
    )
  )
}

export default CustomInfoRequests
