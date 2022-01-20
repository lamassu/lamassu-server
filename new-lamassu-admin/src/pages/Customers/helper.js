import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import { parse, isValid, format } from 'date-fns/fp'
import { Field, useFormikContext } from 'formik'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import * as R from 'ramda'
import * as Yup from 'yup'

import { RadioGroup, TextInput, Dropdown } from 'src/components/inputs/formik'
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
  },
  picker: {
    width: 150
  },
  field: {
    '& > *:last-child': {
      marginBottom: 24
    }
  },
  dropdownField: {
    marginTop: 16,
    minWidth: 155
  }
})

const CUSTOMER_BLOCKED = 'blocked'
const CUSTOM = 'custom'
const REQUIREMENT = 'requirement'
const ID_CARD_DATA = 'idCardData'

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

// Manual Entry Wizard

const entryOptions = [
  { display: 'Custom entry', code: 'custom' },
  { display: 'Populate existing requirement', code: 'requirement' }
]

const dataOptions = [
  { display: 'Text', code: 'text' }
  // TODO: Requires backend modifications to support File and Image
  // { display: 'File', code: 'file' },
  // { display: 'Image', code: 'image' }
]

const requirementOptions = [
  { display: 'ID card image', code: 'idCardPhoto' },
  { display: 'ID data', code: 'idCardData' },
  { display: 'US SSN', code: 'usSsn' },
  { display: 'Customer camera', code: 'frontCamera' }
]

const customTextOptions = [
  { label: 'Data entry title', name: 'title' },
  { label: 'Data entry', name: 'data' }
]

const customUploadOptions = [{ label: 'Data entry title', name: 'title' }]

const entryTypeSchema = Yup.lazy(values => {
  if (values.entryType === 'custom') {
    return Yup.object().shape({
      entryType: Yup.string().required(),
      dataType: Yup.string().required()
    })
  } else if (values.entryType === 'requirement') {
    return Yup.object().shape({
      entryType: Yup.string().required(),
      requirement: Yup.string().required()
    })
  }
})

const customInfoRequirementSchema = Yup.lazy(values => {
  if (R.isNil(values.customInfoRequirement)) {
    return Yup.object().shape({
      customInfoRequirement: Yup.string().required()
    })
  }
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

const updateRequirementOptions = it => [
  {
    display: 'Custom information requirement',
    code: 'custom'
  },
  ...it
]

const EntryType = ({ customInfoRequirementOptions }) => {
  const classes = useStyles()
  const { values } = useFormikContext()

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
            options={
              !R.isEmpty(customInfoRequirementOptions)
                ? updateRequirementOptions(requirementOptions)
                : requirementOptions
            }
            labelClassName={classes.label}
            radioClassName={classes.radio}
            className={classnames(classes.radioGroup, classes.specialGrid)}
          />
        </div>
      )}
    </>
  )
}

const ManualDataEntry = ({
  selectedValues,
  customInfoRequirementOptions,
  customInfoRequirements,
  selectedCustomInfoRequirement
}) => {
  const classes = useStyles()

  const typeOfEntrySelected = selectedValues?.entryType
  const dataTypeSelected = selectedValues?.dataType
  const requirementSelected = selectedValues?.requirement

  const displayRequirements = typeOfEntrySelected === 'requirement'

  const isCustomInfoRequirement = requirementSelected === CUSTOM

  const updatedRequirementOptions = !R.isEmpty(customInfoRequirementOptions)
    ? updateRequirementOptions(requirementOptions)
    : requirementOptions

  const requirementName = displayRequirements
    ? R.find(R.propEq('code', requirementSelected))(updatedRequirementOptions)
        .display
    : ''

  const title = displayRequirements
    ? `Requirement ${requirementName}`
    : `Custom ${dataTypeSelected} entry`

  const elements = displayRequirements
    ? requirementElements[requirementSelected]
    : customElements[dataTypeSelected]

  const upload = displayRequirements
    ? requirementSelected === 'idCardPhoto' ||
      requirementSelected === 'frontCamera'
    : dataTypeSelected === 'file' || dataTypeSelected === 'image'

  const customInfoRequirementType = R.view(
    R.lensPath([0, 'customRequest', 'input', 'type']),
    R.filter(it => it.id === selectedCustomInfoRequirement)(
      customInfoRequirements
    )
  )

  console.log(customInfoRequirementType)

  return (
    <>
      <Box display="flex" alignItems="center">
        <H4>{title}</H4>
      </Box>
      {isCustomInfoRequirement && (
        <div>
          <Field
            className={classes.dropdownField}
            component={Dropdown}
            label="Available requests"
            name="customInfoRequirement"
            options={customInfoRequirementOptions}
          />
          {(customInfoRequirementType === 'text' ||
            customInfoRequirementType === 'numerical') && (
            <div>{console.log('')}</div>
          )}
          {customInfoRequirementType === 'choiceList' && (
            <div>
              <div>{console.log('')}</div>
            </div>
          )}
        </div>
      )}
      <div className={classes.field}>
        {!upload &&
          !isCustomInfoRequirement &&
          elements.options.map(({ label, name }) => (
            <Field
              name={name}
              label={label}
              component={TextInput}
              width={390}
            />
          ))}
      </div>
      {upload && (
        <Upload
          type={
            displayRequirements ? requirementSelected : dataTypeSelected
          }></Upload>
      )}
    </>
  )
}

const customElements = {
  text: {
    schema: customTextSchema,
    options: customTextOptions,
    Component: ManualDataEntry,
    initialValues: { data: '', title: '' },
    saveType: 'customEntry'
  },
  file: {
    schema: customFileSchema,
    options: customUploadOptions,
    Component: ManualDataEntry,
    initialValues: { file: null, title: '' },
    saveType: 'customEntryUpload'
  },
  image: {
    schema: customImageSchema,
    options: customUploadOptions,
    Component: ManualDataEntry,
    initialValues: { image: null, title: '' },
    saveType: 'customEntryUpload'
  }
}

const entryType = {
  schema: entryTypeSchema,
  options: entryOptions,
  Component: EntryType,
  initialValues: { entryType: '' }
}

// Customer data

const customerDataElements = {
  idCardData: [
    {
      name: 'firstName',
      label: 'First name',
      component: TextInput
    },
    {
      name: 'documentNumber',
      label: 'ID number',
      component: TextInput
    },
    {
      name: 'dateOfBirth',
      label: 'Birthdate',
      component: TextInput
    },
    {
      name: 'gender',
      label: 'Gender',
      component: TextInput
    },
    {
      name: 'lastName',
      label: 'Last name',
      component: TextInput
    },
    {
      name: 'expirationDate',
      label: 'Expiration Date',
      component: TextInput
    },
    {
      name: 'country',
      label: 'Country',
      component: TextInput
    }
  ],
  usSsn: [
    {
      name: 'usSsn',
      label: 'US SSN',
      component: TextInput,
      size: 190
    }
  ],
  idCardPhoto: [{ name: 'idCardPhoto' }],
  frontCamera: [{ name: 'frontCamera' }]
}

const customerDataSchemas = {
  idCardData: Yup.object().shape({
    firstName: Yup.string().required(),
    lastName: Yup.string().required(),
    documentNumber: Yup.string().required(),
    dateOfBirth: Yup.string()
      .test({
        test: val => isValid(parse(new Date(), 'yyyy-MM-dd', val))
      })
      .required(),
    gender: Yup.string().required(),
    country: Yup.string().required(),
    expirationDate: Yup.string()
      .test({
        test: val => isValid(parse(new Date(), 'yyyy-MM-dd', val))
      })
      .required()
  }),
  usSsn: Yup.object().shape({
    usSsn: Yup.string().required()
  }),
  idCardPhoto: Yup.object().shape({
    idCardPhoto: Yup.mixed().required()
  }),
  frontCamera: Yup.object().shape({
    frontCamera: Yup.mixed().required()
  })
}

const customInfoRequirementElements = {}

const requirementElements = {
  idCardData: {
    schema: customerDataSchemas.idCardData,
    options: customerDataElements.idCardData,
    Component: ManualDataEntry,
    initialValues: {
      firstName: '',
      lastName: '',
      documentNumber: '',
      dateOfBirth: '',
      gender: '',
      country: '',
      expirationDate: ''
    },
    saveType: 'customerData'
  },
  usSsn: {
    schema: customerDataSchemas.usSsn,
    options: customerDataElements.usSsn,
    Component: ManualDataEntry,
    initialValues: { usSsn: '' },
    saveType: 'customerData'
  },
  idCardPhoto: {
    schema: customerDataSchemas.idCardPhoto,
    options: customerDataElements.idCardPhoto,
    Component: ManualDataEntry,
    initialValues: { idCardPhoto: null },
    saveType: 'customerDataUpload'
  },
  frontCamera: {
    schema: customerDataSchemas.frontCamera,
    options: customerDataElements.frontCamera,
    Component: ManualDataEntry,
    initialValues: { frontCamera: null },
    saveType: 'customerDataUpload'
  },
  custom: {
    schema: customInfoRequirementSchema,
    options: customInfoRequirementElements,
    Component: ManualDataEntry,
    initialValues: { customInfoRequirement: null },
    saveType: 'customInfoRequirement'
  }
}

const formatDates = values => {
  R.map(
    elem =>
      (values[elem] = format('yyyyMMdd')(
        parse(new Date(), 'yyyy-MM-dd', values[elem])
      ))
  )(['dateOfBirth', 'expirationDate'])
  return values
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
  requirementElements,
  formatPhotosData,
  customerDataElements,
  customerDataSchemas,
  formatDates,
  REQUIREMENT,
  CUSTOM,
  ID_CARD_DATA
}
