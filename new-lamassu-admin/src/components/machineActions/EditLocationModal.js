/* eslint-disable no-unused-vars */
import { useMutation, useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import { Form, Formik, FastField } from 'formik'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useEffect, useState } from 'react'
import * as uuid from 'uuid'
import * as Yup from 'yup'

import { ConfirmDialog } from 'src/components/ConfirmDialog'
import ErrorMessage from 'src/components/ErrorMessage'
import { Button } from 'src/components/buttons'
import { Autocomplete } from 'src/components/inputs'
import {
  TextInput,
  Autocomplete as FormikAutocomplete
} from 'src/components/inputs/formik'
import { spacer, tomato } from 'src/styling/variables'
import { fromNamespace, namespaces } from 'src/utils/config'

import Modal from '../Modal'

const GET_COUNTRIES = gql`
  {
    machineLocations {
      id
      label
      addressLine1
      addressLine2
      zipCode
      country
    }
    config
    countries {
      code
      display
    }
  }
`

const EDIT_LOCATION = gql`
  mutation editMachineLocation(
    $id: ID
    $label: String
    $addressLine1: String
    $addressLine2: String
    $zipCode: String
    $country: String
  ) {
    editMachineLocation(
      id: $id
      label: $label
      addressLine1: $addressLine1
      addressLine2: $addressLine2
      zipCode: $zipCode
      country: $country
    )
  }
`

const CREATE_LOCATION = gql`
  mutation createMachineLocation(
    $id: ID
    $label: String
    $addressLine1: String
    $addressLine2: String
    $zipCode: String
    $country: String
  ) {
    createMachineLocation(
      id: $id
      label: $label
      addressLine1: $addressLine1
      addressLine2: $addressLine2
      zipCode: $zipCode
      country: $country
    )
  }
`

const DELETE_LOCATION = gql`
  mutation deleteMachineLocation($locationId: ID) {
    deleteMachineLocation(locationId: $locationId)
  }
`

const ASSIGN_LOCATION = gql`
  mutation assignLocation($machineId: ID, $locationId: ID) {
    assignLocation(machineId: $machineId, locationId: $locationId)
  }
`

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    '& > *': {
      marginTop: 20
    },
    '& > *:last-child': {
      marginTop: 'auto'
    }
  },
  submit: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, 0, 'auto']],
    '& > *': {
      marginRight: 10
    },
    '& > *:last-child': {
      marginRight: 0
    }
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, spacer * 3, 0]]
  },
  existingLocation: {
    marginBottom: 50
  }
}

const useStyles = makeStyles(styles)

const EditLocationModal = ({ machine, handleClose }) => {
  const classes = useStyles()
  const [confirmDialog, setConfirmDialog] = useState(false)
  const { data, loading, refetch } = useQuery(GET_COUNTRIES, {
    onCompleted: () =>
      setPreset(
        R.find(it => it.value?.id === machine.location?.id, locationOptions) ??
          locationOptions[0]
      )
  })
  const [deleteMachineLocation] = useMutation(DELETE_LOCATION)
  const [editMachineLocation] = useMutation(EDIT_LOCATION)
  const [createMachineLocation] = useMutation(CREATE_LOCATION)
  const [assignMachineLocation] = useMutation(ASSIGN_LOCATION)

  const machineLocations = data?.machineLocations ?? []
  const countries = data?.countries ?? []
  const locationOptions = [
    { label: 'New location' },
    ...R.map(it => ({ label: it.label, value: it }), machineLocations)
  ]
  const localeCountry = R.find(
    it => it.code === fromNamespace(namespaces.LOCALE)(data?.config).country,
    countries
  )
  const [preset, setPreset] = useState(null)

  const initialValues = {
    location: {
      id: machine.location?.id ?? '',
      label: machine.location?.label ?? '',
      addressLine1: machine.location?.addressLine1 ?? '',
      addressLine2: machine.location?.addressLine2 ?? '',
      zipCode: machine.location?.zipCode ?? '',
      country: machine.location?.country ?? localeCountry?.display ?? ''
    }
  }

  const newLocationValues = {
    location: {
      id: '',
      label: '',
      addressLine1: '',
      addressLine2: '',
      zipCode: '',
      country: localeCountry?.display ?? ''
    }
  }

  const validationSchema = Yup.object().shape({
    location: Yup.object().shape({
      label: Yup.string()
        .required('A label is required.')
        .max(50),
      addressLine1: Yup.string()
        .required('An address is required.')
        .max(75),
      addressLine2: Yup.string().max(75),
      zipCode: Yup.string()
        .required('A zip code is required.')
        .max(20),
      country: Yup.string()
        .required('A country is required.')
        .max(50)
    })
  })

  const newLocationOption = R.find(it => !it.value, locationOptions)

  const isNewLocation = it => R.equals(it, newLocationOption)

  const createLocation = location => {
    const newLocationId = uuid.v4()
    return createMachineLocation({
      variables: { ...location, id: newLocationId }
    })
      .then(() =>
        assignMachineLocation({
          variables: {
            machineId: machine.deviceId,
            locationId: newLocationId
          }
        })
      )
      .then(() => handleClose())
  }

  const editLocation = location => {
    editMachineLocation({
      variables: { ...location }
    })
      .then(() =>
        assignMachineLocation({
          variables: {
            machineId: machine.deviceId,
            locationId: location.id
          }
        })
      )
      .then(() => handleClose())
  }

  return (
    !loading && (
      <Modal
        title={`${
          isNewLocation(preset) ? 'Create new' : 'Editing'
        } machine location`}
        width={600}
        height={600}
        open={true}
        handleClose={handleClose}>
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={({ location }) => {
            if (R.isEmpty(location.id)) {
              return createLocation(location)
            }
            return editLocation(location)
          }}>
          {({ errors, setFieldValue }) => (
            <>
              {!R.isEmpty(machineLocations) && (
                <div className={classes.existingLocation}>
                  <Autocomplete
                    fullWidth
                    label={`Select an existing location`}
                    getOptionSelected={R.eqProps('value')}
                    labelProp={'label'}
                    value={preset}
                    options={locationOptions}
                    onChange={(_, it) => {
                      setPreset(it)
                      setFieldValue(
                        'location',
                        isNewLocation(it)
                          ? newLocationValues.location
                          : it.value
                      )
                    }}
                  />
                </div>
              )}
              <Form className={classes.form}>
                <FastField
                  name="location.label"
                  label="Location label"
                  component={TextInput}
                  error={errors.location?.label}
                />
                <FastField
                  name="location.addressLine1"
                  label="Address line 1"
                  component={TextInput}
                  error={errors.location?.addressLine1}
                />
                <FastField
                  name="location.addressLine2"
                  label="Address line 2"
                  component={TextInput}
                  error={errors.location?.addressLine2}
                />
                <FastField
                  name="location.zipCode"
                  label="Zip/Postal code"
                  component={TextInput}
                  error={errors.location?.zipCode}
                />
                <FastField
                  name="location.country"
                  label="Country"
                  component={FormikAutocomplete}
                  fullWidth
                  options={countries}
                  labelProp="display"
                  valueProp="display"
                  error={errors.location?.country}
                />
                <div className={classes.footer}>
                  {!R.isEmpty(errors) && (
                    <ErrorMessage>
                      {R.head(R.values(errors.location))}
                    </ErrorMessage>
                  )}
                  <div className={classes.submit}>
                    {!isNewLocation(preset) && (
                      <Button
                        type="button"
                        onClick={() => setConfirmDialog(true)}>
                        Delete
                      </Button>
                    )}
                    <Button type="submit">Submit</Button>
                  </div>
                </div>
              </Form>
              <ConfirmDialog
                open={confirmDialog}
                title={`Delete this location?`}
                toBeConfirmed={preset?.value?.label}
                onConfirmed={() => {
                  deleteMachineLocation({
                    variables: { locationId: preset.value.id }
                  })
                    .then(() => setConfirmDialog(false))
                    .then(() => refetch())
                    .then(() =>
                      setFieldValue('location', newLocationValues.location)
                    )
                    .then(() => setPreset(newLocationOption))
                }}
                onDismissed={() => setConfirmDialog(false)}
              />
            </>
          )}
        </Formik>
      </Modal>
    )
  )
}

export default EditLocationModal
