import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import { Field, useFormikContext } from 'formik'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import * as R from 'ramda'
import * as Yup from 'yup'

import { RadioGroup, TextInput } from 'src/components/inputs/formik'
import { H4 } from 'src/components/typography'
import { errorColor } from 'src/styling/variables'
import { MANUAL } from 'src/utils/constants'

import { Upload } from './components'

const useStyles = makeStyles({
  radio: {
    padding: 4,
    margin: 4
  },
  radioGroup: {
    flexDirection: 'row'
  },
  error: {
    color: errorColor
  },
  specialLabel: {
    height: 40,
    padding: 0,
    width: 250
  },
  label: {
    height: 40,
    padding: 0
  },
  specialGrid: {
    display: 'grid',
    gridTemplateColumns: [[182, 162, 141]]
  }
})

const CUSTOMER_BLOCKED = 'blocked'

const getAuthorizedStatus = (it, triggers) => {
  const fields = [
    'frontCameraPath',
    'idCardData',
    'idCardPhotoPath',
    'usSsn',
    'sanctions'
  ]

  const isManualField = fieldName => {
    const manualOverrides = R.filter(
      ite => R.equals(R.toLower(ite.automation), MANUAL),
      triggers?.overrides ?? []
    )

    return (
      !!R.find(ite => R.equals(ite.requirement, fieldName), manualOverrides) ||
      R.equals(triggers.automation, MANUAL)
    )
  }

  const pendingFieldStatus = R.map(
    ite =>
      !R.isNil(it[`${ite}`])
        ? isManualField(ite)
          ? R.equals(it[`${ite}Override`], 'automatic')
          : false
        : false,
    fields
  )

  if (it.authorizedOverride === CUSTOMER_BLOCKED)
    return { label: 'Blocked', type: 'error' }
  if (it.isSuspended)
    return it.daysSuspended > 0
      ? { label: `${it.daysSuspended} day suspension`, type: 'warning' }
      : { label: `< 1 day suspension`, type: 'warning' }
  if (R.any(ite => ite === true, pendingFieldStatus))
    return { label: 'Pending', type: 'warning' }
  return { label: 'Authorized', type: 'success' }
}

const getFormattedPhone = (phone, country) => {
  const phoneNumber =
    phone && country ? parsePhoneNumberFromString(phone, country) : null

  return phoneNumber ? phoneNumber.formatInternational() : phone
}

const getName = it => {
  const idData = R.path(['idCardData'])(it)

  return `${R.path(['firstName'])(idData) ?? ''} ${R.path(['lastName'])(
    idData
  ) ?? ''}`.trim()
}

const entryOptions = [
  { display: 'Custom entry', code: 'custom' },
  { display: 'Populate existing requirement', code: 'requirement' }
]

const dataOptions = [
  { display: 'Text', code: 'text' },
  { display: 'File', code: 'file' },
  { display: 'Image', code: 'image' }
]

const requirementOptions = [
  { display: 'Birthdate', code: 'birthdate' },
  { display: 'ID card image', code: 'idCardPhoto' },
  { display: 'ID data', code: 'idCardData' },
  { display: 'Customer camera', code: 'facephoto' },
  { display: 'US SSN', code: 'usSsn' }
]

const customTextOptions = [
  { display: 'Data entry title', code: 'title' },
  { display: 'Data entry', code: 'data' }
]

const customUploadOptions = [{ display: 'Data entry title', code: 'title' }]

const entryTypeSchema = Yup.object().shape({
  entryType: Yup.string().required()
})

const customFileSchema = Yup.object().shape({
  title: Yup.string().required(),
  file: Yup.mixed().required()
})

const customImageSchema = Yup.object().shape({
  title: Yup.string().required(),
  image: Yup.mixed().required()
})

const customTextSchema = Yup.object().shape({
  title: Yup.string().required(),
  data: Yup.string().required()
})

const EntryType = () => {
  const classes = useStyles()
  const { values } = useFormikContext()

  const CUSTOM = 'custom'
  const REQUIREMENT = 'requirement'

  const displayCustomOptions = values.entryType === CUSTOM
  const displayRequirementOptions = values.entryType === REQUIREMENT

  return (
    <>
      <Box display="flex" alignItems="center">
        <H4>Type of entry</H4>
      </Box>
      <Field
        component={RadioGroup}
        name="entryType"
        options={entryOptions}
        labelClassName={classes.specialLabel}
        radioClassName={classes.radio}
        className={classnames(classes.radioGroup, classes.specialGrid)}
      />
      {displayCustomOptions && (
        <div>
          <Box display="flex" alignItems="center">
            <H4>Type of data</H4>
          </Box>
          <Field
            component={RadioGroup}
            name="dataType"
            options={dataOptions}
            labelClassName={classes.label}
            radioClassName={classes.radio}
            className={classnames(classes.radioGroup, classes.specialGrid)}
          />
        </div>
      )}
      {displayRequirementOptions && (
        <div>
          <Box display="flex" alignItems="center">
            <H4>Requirements</H4>
          </Box>
          <Field
            component={RadioGroup}
            name="requirement"
            options={requirementOptions}
            labelClassName={classes.label}
            radioClassName={classes.radio}
            className={classnames(classes.radioGroup, classes.specialGrid)}
          />
        </div>
      )}
    </>
  )
}

const CustomData = ({ selectedValues }) => {
  const dataTypeSelected = selectedValues?.dataType
  const upload = dataTypeSelected === 'file' || dataTypeSelected === 'image'
  return (
    <>
      <Box display="flex" alignItems="center">
        <H4>{`Custom ${dataTypeSelected} entry`}</H4>
      </Box>
      {customElements[dataTypeSelected].options.map(({ display, code }) => (
        <Field name={code} label={display} component={TextInput} width={390} />
      ))}
      {upload && <Upload type={dataTypeSelected}></Upload>}
    </>
  )
}

const customElements = {
  text: {
    schema: customTextSchema,
    options: customTextOptions,
    Component: CustomData,
    initialValues: { data: '', title: '' }
  },
  file: {
    schema: customFileSchema,
    options: customUploadOptions,
    Component: CustomData,
    initialValues: { file: '', title: '' }
  },
  image: {
    schema: customImageSchema,
    options: customUploadOptions,
    Component: CustomData,
    initialValues: { image: '', title: '' }
  }
}

const entryType = {
  schema: entryTypeSchema,
  options: entryOptions,
  Component: EntryType,
  initialValues: { entryType: '' }
}

const mapKeys = pair => {
  const [key, value] = pair
  if (key === 'txCustomerPhotoPath' || key === 'frontCameraPath') {
    return ['path', value]
  }
  if (key === 'txCustomerPhotoAt' || key === 'frontCameraAt') {
    return ['date', value]
  }
  return pair
}

const addPhotoDir = R.map(it => {
  const hasFrontCameraData = R.has('id')(it)
  return hasFrontCameraData
    ? { ...it, photoDir: 'operator-data/customersphotos' }
    : { ...it, photoDir: 'front-camera-photo' }
})

const standardizeKeys = R.map(R.compose(R.fromPairs, R.map(mapKeys), R.toPairs))

const filterByPhotoAvailable = R.filter(
  tx => !R.isNil(tx.date) && !R.isNil(tx.path)
)

const formatPhotosData = R.compose(
  filterByPhotoAvailable,
  addPhotoDir,
  standardizeKeys
)

export {
  getAuthorizedStatus,
  getFormattedPhone,
  getName,
  entryType,
  customElements,
  formatPhotosData
}
