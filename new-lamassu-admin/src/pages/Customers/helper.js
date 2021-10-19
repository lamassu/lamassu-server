import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import { Field, useFormikContext } from 'formik'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import * as R from 'ramda'
import * as Yup from 'yup'

import { RadioGroup } from 'src/components/inputs/formik'
import { H4 } from 'src/components/typography'
import { errorColor } from 'src/styling/variables'

const useStyles = makeStyles({
  radioLabel: {
    height: 40,
    padding: [[0, 10]]
  },
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
    padding: 0
  },
  specialGrid: {
    display: 'grid',
    gridTemplateColumns: [[182, 162, 141]]
  },
  directionIcon: {
    marginRight: 2
  },
  directionName: {
    marginLeft: 6
  },
  thresholdWrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  thresholdTitle: {
    marginTop: 50
  },
  thresholdContentWrapper: {
    display: 'flex',
    flexDirection: 'row'
  },
  thresholdField: {
    marginRight: 6,
    width: 75
  },
  description: {
    marginTop: 7
  },
  space: {
    marginLeft: 6,
    marginRight: 6
  },
  lastSpace: {
    marginLeft: 6
  },
  suspensionDays: {
    width: 34
  },
  input: {
    marginTop: -2
  },
  limitedInput: {
    width: 50
  },
  daysInput: {
    width: 60
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

const entryTypeSchema = Yup.object().shape({
  entryType: Yup.object({
    entryType: Yup.string().required()
  }).required()
})

const EntryType = () => {
  const classes = useStyles()
  const { values } = useFormikContext()
  const displayCustom = values.entryType === 'custom'

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
      {displayCustom && (
        <div>
          <Box display="flex" alignItems="center">
            <H4>Type of data</H4>
          </Box>
          <Field
            component={RadioGroup}
            name="dataType"
            options={dataOptions}
            labelClassName={classes.specialLabel}
            radioClassName={classes.radio}
            className={classnames(classes.radioGroup, classes.specialGrid)}
          />
        </div>
      )}
      {!displayCustom && (
        <div>
          <Box display="flex" alignItems="center">
            <H4>Requirements</H4>
          </Box>
          <Field
            component={RadioGroup}
            name="requirement"
            options={requirementOptions}
            labelClassName={classes.specialLabel}
            radioClassName={classes.radio}
            className={classnames(classes.radioGroup, classes.specialGrid)}
          />
        </div>
      )}
    </>
  )
}

const entryType = {
  schema: entryTypeSchema,
  options: entryOptions,
  Component: EntryType,
  initialValues: { entryType: { entryType: '' } }
}

export { getAuthorizedStatus, getFormattedPhone, getName, entryType }
