import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import { differenceInYears, parse, format } from 'date-fns/fp'
import _ from 'lodash/fp'
import * as R from 'ramda'
import { useState, React } from 'react'
import * as Yup from 'yup'

import ImagePopper from 'src/components/ImagePopper'
import { FeatureButton } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import { H3, Info3 } from 'src/components/typography'
import {
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'
import { ReactComponent as CardIcon } from 'src/styling/icons/ID/card/comet.svg'
import { ReactComponent as PhoneIcon } from 'src/styling/icons/ID/phone/comet.svg'
import { ReactComponent as CrossedCameraIcon } from 'src/styling/icons/ID/photo/crossed-camera.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/comet.svg'
import { ReactComponent as CustomerListViewReversedIcon } from 'src/styling/icons/circle buttons/customer-list-view/white.svg'
import { ReactComponent as CustomerListViewIcon } from 'src/styling/icons/circle buttons/customer-list-view/zodiac.svg'
import { ReactComponent as OverviewReversedIcon } from 'src/styling/icons/circle buttons/overview/white.svg'
import { ReactComponent as OverviewIcon } from 'src/styling/icons/circle buttons/overview/zodiac.svg'
import { URI } from 'src/utils/apollo'

import styles from './CustomerData.styles.js'
import { EditableCard } from './components'
import { getName } from './helper.js'

const useStyles = makeStyles(styles)

const IMAGE_WIDTH = 165
const IMAGE_HEIGHT = 45
const POPUP_IMAGE_WIDTH = 360
const POPUP_IMAGE_HEIGHT = 240

const Photo = ({ show, src }) => {
  const classes = useStyles({ width: IMAGE_WIDTH })

  return (
    <>
      {show ? (
        <ImagePopper
          src={src}
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          popupWidth={POPUP_IMAGE_WIDTH}
          popupHeight={POPUP_IMAGE_HEIGHT}
        />
      ) : (
        <div className={classes.photoWrapper}>
          <CrossedCameraIcon />
        </div>
      )}
    </>
  )
}

const CustomerData = ({
  customer,
  updateCustomer,
  editCustomer,
  deleteEditedData
}) => {
  const classes = useStyles()
  const [listView, setListView] = useState(false)

  const idData = R.path(['idCardData'])(customer)
  const rawExpirationDate = R.path(['expirationDate'])(idData)
  const country = R.path(['country'])(idData)
  const rawDob = R.path(['dateOfBirth'])(idData)

  const sanctions = R.path(['sanctions'])(customer)
  const sanctionsAt = R.path(['sanctionsAt'])(customer)
  const sanctionsDisplay = !sanctionsAt
    ? 'Not checked yet'
    : sanctions
    ? 'Passed'
    : 'Failed'

  const customEntries = null // get customer custom entries
  const customRequirements = null // get customer custom requirements

  const isEven = elem => elem % 2 === 0

  const getVisibleCards = _.filter(
    elem =>
      !_.isEmpty(elem.fields) ||
      (!_.isNil(elem.children) && !_.isNil(elem.state))
  )

  const getAvailableFields = _.filter(({ value }) => value !== '')

  const schemas = {
    idScan: Yup.object().shape({
      name: Yup.string(),
      idNumber: Yup.string(),
      birthDate: Yup.string(),
      age: Yup.string(),
      gender: Yup.string(),
      state: Yup.string(),
      expirationDate: Yup.string()
    }),
    usSsn: Yup.object().shape({
      usSsn: Yup.string()
    }),
    idCardPhoto: Yup.object().shape({
      idCardPhoto: Yup.mixed()
    }),
    frontCamera: Yup.object().shape({
      frontCamera: Yup.mixed()
    })
  }

  const idScanElements = [
    {
      name: 'name',
      label: 'Name',
      value: `${getName(customer)}`,
      component: TextInput
    },
    {
      name: 'idNumber',
      label: 'ID number',
      value: R.path(['documentNumber'])(idData) ?? '',
      component: TextInput
    },
    {
      name: 'birthDate',
      label: 'Birth Date',
      value:
        (rawDob &&
          format('yyyy-MM-dd')(parse(new Date(), 'yyyyMMdd', rawDob))) ??
        '',
      component: TextInput
    },
    {
      name: 'age',
      label: 'Age',
      value:
        (rawDob &&
          differenceInYears(
            parse(new Date(), 'yyyyMMdd', rawDob),
            new Date()
          )) ??
        '',
      component: TextInput
    },
    {
      name: 'gender',
      label: 'Gender',
      value: R.path(['gender'])(idData) ?? '',
      component: TextInput
    },
    {
      name: 'state',
      label: country === 'Canada' ? 'Province' : 'State',
      value: R.path(['state'])(idData) ?? '',
      component: TextInput
    },
    {
      name: 'expirationDate',
      label: 'Expiration Date',
      value:
        (rawExpirationDate &&
          format('yyyy-MM-dd')(
            parse(new Date(), 'yyyyMMdd', rawExpirationDate)
          )) ??
        '',
      component: TextInput
    }
  ]

  const usSsnElements = [
    {
      name: 'usSsn',
      label: 'US SSN',
      value: `${customer.usSsn ?? ''}`,
      component: TextInput,
      size: 190
    }
  ]

  const idCardPhotoElements = [{ name: 'idCardPhoto' }]
  const frontCameraElements = [{ name: 'frontCamera' }]

  const initialValues = {
    idScan: {
      name: '',
      idNumber: '',
      birthDate: '',
      age: '',
      gender: '',
      state: '',
      expirationDate: ''
    },
    usSsn: {
      usSsn: ''
    },
    frontCamera: {
      frontCamera: null
    },
    idCardPhoto: {
      idCardPhoto: null
    }
  }

  const cards = [
    {
      fields: getAvailableFields(idScanElements),
      title: 'ID Scan',
      titleIcon: <PhoneIcon className={classes.cardIcon} />,
      state: R.path(['idCardDataOverride'])(customer),
      authorize: () =>
        updateCustomer({ idCardDataOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ idCardDataOverride: OVERRIDE_REJECTED }),
      deleteEditedData: () => deleteEditedData({ idCardData: null }),
      save: values => editCustomer({ idCardData: values }),
      validationSchema: schemas.idScan,
      initialValues: initialValues.idScan
    },
    {
      title: 'SMS Confirmation',
      titleIcon: <CardIcon className={classes.cardIcon} />,
      authorize: () => {},
      reject: () => {},
      save: () => {}
    },
    {
      title: 'Name',
      titleIcon: <EditIcon className={classes.editIcon} />,
      authorize: () => {},
      reject: () => {},
      save: () => {}
    },
    {
      title: 'Sanctions check',
      titleIcon: <EditIcon className={classes.editIcon} />,
      state: R.path(['sanctionsOverride'])(customer),
      authorize: () =>
        updateCustomer({ sanctionsOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ sanctionsOverride: OVERRIDE_REJECTED }),
      children: <Info3>{sanctionsDisplay}</Info3>
    },
    {
      fields: getAvailableFields(frontCameraElements),
      title: 'Front facing camera',
      titleIcon: <EditIcon className={classes.editIcon} />,
      state: R.path(['frontCameraOverride'])(customer),
      authorize: () =>
        updateCustomer({ frontCameraOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ frontCameraOverride: OVERRIDE_REJECTED }),
      save: values => editCustomer({ frontCamera: values.frontCamera }),
      deleteEditedData: () => deleteEditedData({ frontCamera: null }),
      children: customer.frontCameraPath ? (
        <Photo
          show={customer.frontCameraPath}
          src={`${URI}/front-camera-photo/${R.path(['frontCameraPath'])(
            customer
          )}`}
        />
      ) : null,
      hasImage: true,
      validationSchema: schemas.frontCamera,
      initialValues: initialValues.frontCamera
    },
    {
      fields: getAvailableFields(idCardPhotoElements),
      title: 'ID card image',
      titleIcon: <EditIcon className={classes.editIcon} />,
      state: R.path(['idCardPhotoOverride'])(customer),
      authorize: () =>
        updateCustomer({ idCardPhotoOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ idCardPhotoOverride: OVERRIDE_REJECTED }),
      save: values => editCustomer({ idCardPhoto: values.idCardPhoto }),
      deleteEditedData: () => deleteEditedData({ idCardPhoto: null }),
      children: customer.idCardPhotoPath ? (
        <Photo
          show={customer.idCardPhotoPath}
          src={`${URI}/id-card-photo/${R.path(['idCardPhotoPath'])(customer)}`}
        />
      ) : null,
      hasImage: true,
      validationSchema: schemas.idCardPhoto,
      initialValues: initialValues.idCardPhoto
    },
    {
      fields: getAvailableFields(usSsnElements),
      title: 'US SSN',
      titleIcon: <CardIcon className={classes.cardIcon} />,
      state: R.path(['usSsnOverride'])(customer),
      authorize: () => updateCustomer({ usSsnOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ usSsnOverride: OVERRIDE_REJECTED }),
      save: values => editCustomer({ usSsn: values.usSsn }),
      deleteEditedData: () => deleteEditedData({ usSsn: null }),
      validationSchema: schemas.usSsn,
      initialValues: initialValues.usSsn
    }
  ]

  const editableCard = (
    {
      title,
      authorize,
      reject,
      state,
      titleIcon,
      fields,
      save,
      deleteEditedData,
      children,
      validationSchema,
      initialValues,
      hasImage
    },
    idx
  ) => {
    return (
      <EditableCard
        title={title}
        key={idx}
        authorize={authorize}
        reject={reject}
        state={state}
        titleIcon={titleIcon}
        hasImage={hasImage}
        fields={fields}
        children={children}
        validationSchema={validationSchema}
        initialValues={initialValues}
        save={save}
        deleteEditedData={deleteEditedData}></EditableCard>
    )
  }

  const visibleCards = getVisibleCards(cards)

  return (
    <div>
      <div className={classes.header}>
        <H3 className={classes.title}>{'Customer data'}</H3>
        <FeatureButton
          active={!listView}
          className={classes.viewIcons}
          Icon={OverviewIcon}
          InverseIcon={OverviewReversedIcon}
          onClick={() => setListView(false)}
        />
        <FeatureButton
          active={listView}
          className={classes.viewIcons}
          Icon={CustomerListViewIcon}
          InverseIcon={CustomerListViewReversedIcon}
          onClick={() => setListView(true)}></FeatureButton>
      </div>
      <div>
        {!listView && customer && (
          <Grid container>
            <Grid container direction="column" item xs={6}>
              {visibleCards.map((elem, idx) => {
                return isEven(idx) ? editableCard(elem, idx) : null
              })}
            </Grid>
            <Grid container direction="column" item xs={6}>
              {visibleCards.map((elem, idx) => {
                return !isEven(idx) ? editableCard(elem, idx) : null
              })}
            </Grid>
          </Grid>
        )}
        {customEntries && (
          <div className={classes.wrapper}>
            <span className={classes.separator}>Custom data entry</span>
          </div>
        )}
        {customRequirements && (
          <div className={classes.wrapper}>
            <span className={classes.separator}>Custom requirements</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerData
