import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import { parse, isValid } from 'date-fns/fp'
import { Field, useFormikContext } from 'formik'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import * as R from 'ramda'
import * as Yup from 'yup'

import { RadioGroup, TextInput } from 'src/components/inputs/formik'
import { H4 } from 'src/components/typography'
import { errorColor } from 'src/styling/variables'

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

const getAuthorizedStatus = it =>
  it.authorizedOverride === CUSTOMER_BLOCKED
    ? { label: 'Blocked', type: 'error' }
    : it.isSuspended
    ? it.daysSuspended > 0
      ? { label: `${it.daysSuspended} day suspension`, type: 'warning' }
      : { label: `< 1 day suspension`, type: 'warning' }
    : { label: 'Authorized', type: 'success' }

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
  { display: 'Customer camera', code: 'facephoto' }
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

const EntryType = ({ hasCustomRequirementOptions }) => {
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
            options={
              hasCustomRequirementOptions
                ? [
                    {
                      display: 'Custom information requirement',
                      code: 'custom'
                    },
                    ...requirementOptions
                  ]
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

// Customer data

const customerDataElements = {
  idScanElements: [
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
  usSsnElements: [
    {
      name: 'usSsn',
      label: 'US SSN',
      component: TextInput,
      size: 190
    }
  ],
  idCardPhotoElements: [{ name: 'idCardPhoto' }],
  frontCameraElements: [{ name: 'frontCamera' }]
}

const customerDataschemas = {
  idScan: Yup.object().shape({
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
  formatPhotosData,
  customerDataElements,
  customerDataschemas
}
