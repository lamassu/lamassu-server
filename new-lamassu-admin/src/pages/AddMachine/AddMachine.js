import { useMutation, useQuery } from '@apollo/react-hooks'
import { Dialog, DialogContent, SvgIcon, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import { Form, Formik, FastField } from 'formik'
import gql from 'graphql-tag'
import QRCode from 'qrcode.react'
import * as R from 'ramda'
import React, { memo, useState, useEffect, useRef } from 'react'
import * as uuid from 'uuid'
import * as Yup from 'yup'

import Title from 'src/components/Title'
import { Button } from 'src/components/buttons'
import { Autocomplete } from 'src/components/inputs'
import {
  TextInput,
  Autocomplete as FormikAutocomplete
} from 'src/components/inputs/formik'
import Sidebar from 'src/components/layout/Sidebar'
import { Info2, P } from 'src/components/typography'
import { ReactComponent as CameraIcon } from 'src/styling/icons/ID/photo/zodiac.svg'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { ReactComponent as CompleteStageIconSpring } from 'src/styling/icons/stage/spring/complete.svg'
import { ReactComponent as CompleteStageIconZodiac } from 'src/styling/icons/stage/zodiac/complete.svg'
import { ReactComponent as CurrentStageIconZodiac } from 'src/styling/icons/stage/zodiac/current.svg'
import { ReactComponent as EmptyStageIconZodiac } from 'src/styling/icons/stage/zodiac/empty.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import { primaryColor } from 'src/styling/variables'
import { fromNamespace, namespaces } from 'src/utils/config'

import styles from './styles'

const SAVE_CONFIG = gql`
  mutation createPairingTotem($name: String!, $location: JSONObject!) {
    createPairingTotem(name: $name, location: $location)
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

const useStyles = makeStyles(styles)

const getSize = R.compose(R.length, R.pathOr([], ['machines']))

const QrCodeComponent = ({ classes, qrCode, name, count, onPaired }) => {
  const timeout = useRef(null)
  const CLOSE_SCREEN_TIMEOUT = 2000
  const { data } = useQuery(GET_MACHINES, { pollInterval: 10000 })

  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }
    }
  }, [])

  const addedMachine = data?.machines?.find(m => m.name === name)
  const hasNewMachine = getSize(data) > count && addedMachine
  if (hasNewMachine) {
    timeout.current = setTimeout(
      () => onPaired(addedMachine),
      CLOSE_SCREEN_TIMEOUT
    )
  }

  return (
    <>
      <Info2 className={classes.qrTitle}>
        Scan QR code with your new cryptomat
      </Info2>
      <div className={classes.qrCodeWrapper}>
        <div className={classes.qrCodeImageWrapper}>
          <QRCode
            size={280}
            fgColor={primaryColor}
            includeMargin
            value={qrCode}
            className={classes.qrCodeBorder}
          />
          <div className={classes.qrCodeScanMessage}>
            <CameraIcon />
            <P noMargin>Snap a picture and scan</P>
          </div>
        </div>
        <div className={classes.qrTextWrapper}>
          <div className={classes.qrTextInfoWrapper}>
            <div className={classes.qrTextIcon}>
              <WarningIcon />
            </div>
            <div className={classes.textWrapper}>
              <P className={classes.qrText}>
                To pair the machine you need scan the QR code with your machine.
                To do this either snap a picture of this QR code or download it
                through the button above and scan it with the scanning bay on
                your machine.
              </P>
            </div>
          </div>
          {hasNewMachine && (
            <div className={classes.successMessageWrapper}>
              <div className={classes.successMessageIcon}>
                <CompleteStageIconSpring />
              </div>
              <Info2 className={classes.successMessage}>
                Machine has been successfully paired!
              </Info2>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const MachineNameComponent = ({ nextStep, classes, name, setName }) => {
  const { data } = useQuery(GET_MACHINES)
  const machineNames = R.map(R.prop('name'), data?.machines || {})

  const uniqueNameValidator = value => {
    try {
      validationSchema.validateSync(value, {
        context: { machineNames: machineNames }
      })
    } catch (error) {
      return error
    }
  }

  const initialValues = {
    name: name ?? ''
  }

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Machine name is required.')
      .max(50)
      .test(
        'unique-name',
        'Machine name is already in use.',
        (value, context) =>
          !R.any(
            it => R.equals(R.toLower(it), R.toLower(value)),
            context.options.context.machineNames
          )
      )
  })

  return (
    <>
      <Info2 className={classes.nameTitle}>
        Machine Name (ex: Coffee shop 01)
      </Info2>
      <Formik
        validateOnBlur={false}
        validateOnChange={false}
        initialValues={initialValues}
        validate={uniqueNameValidator}
        onSubmit={({ name }) => {
          setName(name)
          nextStep()
        }}>
        {({ errors }) => (
          <Form className={classes.form}>
            <div>
              <FastField
                name="name"
                label="Enter machine name"
                component={TextInput}
              />
            </div>
            {errors && <P className={classes.errorMessage}>{errors.message}</P>}
            <div className={classes.button}>
              <Button type="submit">Next</Button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  )
}

const LocationComponent = ({
  nextStep,
  previousStep,
  classes,
  location,
  name,
  setLocation,
  setQrCode
}) => {
  const [disabled, setDisabled] = useState(false)
  const { data, loading } = useQuery(GET_COUNTRIES)
  const [register] = useMutation(SAVE_CONFIG, {
    onCompleted: ({ createPairingTotem }) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`totem: "${createPairingTotem}" `)
      }
      setQrCode(createPairingTotem)
      nextStep()
    },
    onError: e => console.log(e)
  })

  const machineLocations = data?.machineLocations ?? []
  const countries = data?.countries ?? []
  const localeCountry = R.find(
    it => it.code === fromNamespace(namespaces.LOCALE)(data?.config).country,
    countries
  )

  const initialValues = {
    location: {
      label: location?.label ?? '',
      addressLine1: location?.addressLine1 ?? '',
      addressLine2: location?.addressLine2 ?? '',
      zipCode: location?.zipCode ?? '',
      country: location?.country ?? localeCountry?.display ?? ''
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

  const locationOptions = [
    { label: 'New location' },
    ...R.map(it => ({ label: it.label, value: it }), machineLocations)
  ]
  const [preset, setPreset] = useState(locationOptions[0])

  const newLocationOption = R.find(it => !it.value, locationOptions)

  const isNewLocation = it => R.equals(it, newLocationOption)

  return (
    !loading && (
      <>
        <Info2 className={classes.nameTitle}>
          Machine Name (ex: Coffee shop 01)
        </Info2>
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={({ location }) => {
            setLocation(location)
            register({
              variables: {
                name,
                location: { ...location, id: location.id ?? uuid.v4() }
              }
            })
          }}>
          {({ values, errors, setFieldValue, setFieldTouched }) => (
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
                        isNewLocation(it) ? initialValues.location : it.value
                      )
                      setDisabled(!isNewLocation(it))
                      // NOTE: Autocomplete fields have a weird behavior with the disabled prop, when they already have a value in them (see initialValues),
                      // where they do not disable until being touched, remaining permanently disabled until touched again (if the 'disabled' flag allows it in this case).
                      // Touching the field makes the behavior work as intended
                      setFieldTouched('location.country', !!isNewLocation(it))
                    }}
                  />
                </div>
              )}
              <Form className={classes.form}>
                <div className={classes.locationForm}>
                  <FastField
                    name="location.label"
                    label="Location label"
                    component={TextInput}
                    error={errors.location?.label}
                    disabled={disabled}
                  />
                  <FastField
                    name="location.addressLine1"
                    label="Address line 1"
                    component={TextInput}
                    error={errors.location?.addressLine1}
                    disabled={disabled}
                  />
                  <FastField
                    name="location.addressLine2"
                    label="Address line 2"
                    component={TextInput}
                    error={errors.location?.addressLine2}
                    disabled={disabled}
                  />
                  <FastField
                    name="location.zipCode"
                    label="Zip/Postal code"
                    component={TextInput}
                    error={errors.location?.zipCode}
                    disabled={disabled}
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
                    disabled={disabled}
                  />
                </div>
                {errors && (
                  <P className={classes.errorMessage}>
                    {R.head(R.values(errors.location))}
                  </P>
                )}
                <div className={classes.button}>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!disabled) setLocation(values.location)
                      previousStep()
                    }}>
                    Previous
                  </Button>
                  <Button type="submit">Submit</Button>
                </div>
              </Form>
            </>
          )}
        </Formik>
      </>
    )
  )
}

const steps = [
  {
    label: 'Machine name',
    component: MachineNameComponent
  },
  {
    label: 'Location',
    component: LocationComponent
  },
  {
    label: 'Scan QR code',
    component: QrCodeComponent
  }
]

const renderStepper = (step, it, idx, classes) => {
  const active = step === idx
  const past = idx < step
  const future = idx > step

  return (
    <div className={classes.item}>
      <span
        className={classnames({
          [classes.itemText]: true,
          [classes.itemTextActive]: active,
          [classes.itemTextPast]: past
        })}>
        {it.label}
      </span>
      {active && <CurrentStageIconZodiac />}
      {past && <CompleteStageIconZodiac />}
      {future && <EmptyStageIconZodiac />}
      {idx < steps.length - 1 && (
        <div
          className={classnames({
            [classes.stepperPath]: true,
            [classes.stepperPast]: past
          })}></div>
      )}
    </div>
  )
}

const AddMachine = memo(({ close, onPaired }) => {
  const classes = useStyles()
  const { data } = useQuery(GET_MACHINES)
  const [qrCode, setQrCode] = useState('')
  const [name, setName] = useState('')
  const [location, setLocation] = useState({})
  const [step, setStep] = useState(0)
  const count = getSize(data)

  const Component = steps[step].component

  return (
    <div>
      <Dialog
        fullScreen
        className={classes.dialog}
        open={true}
        aria-labelledby="form-dialog-title">
        <DialogContent className={classes.dialog}>
          <div className={classes.wrapper}>
            <div className={classes.headerDiv}>
              <Title>Add Machine</Title>
              <IconButton disableRipple={true} onClick={close}>
                <SvgIcon color="error">
                  <CloseIcon />
                </SvgIcon>
              </IconButton>
            </div>
            <div className={classes.contentDiv}>
              <Sidebar>
                {steps.map((it, idx) => renderStepper(step, it, idx, classes))}
              </Sidebar>
              <div className={classes.contentWrapper}>
                <Component
                  classes={classes}
                  nextStep={() => setStep(step + 1)}
                  previousStep={() => setStep(step - 1)}
                  count={count}
                  onPaired={onPaired}
                  qrCode={qrCode}
                  setQrCode={setQrCode}
                  name={name}
                  setName={setName}
                  location={location}
                  setLocation={setLocation}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})

export default AddMachine
