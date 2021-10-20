import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import _ from 'lodash/fp'
import moment from 'moment'
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
import { ifNotNull } from 'src/utils/nullCheck'

import styles from './CustomerData.styles.js'
import { EditableCard } from './components'
import { getName } from './helper.js'

const useStyles = makeStyles(styles)

const imageWidth = 165
const imageHeight = 45
const popupImageWidth = 360
const popupImageHeight = 240

const Photo = ({ show, src }) => {
  const classes = useStyles({ width: imageWidth })

  return (
    <>
      {show ? (
        <ImagePopper
          src={src}
          width={imageWidth}
          height={imageHeight}
          popupWidth={popupImageWidth}
          popupHeight={popupImageHeight}
        />
      ) : (
        <div className={classes.photoWrapper}>
          <CrossedCameraIcon />
        </div>
      )}
    </>
  )
}

const CustomerData = ({ customer, updateCustomer }) => {
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

  const isEven = elem => elem % 2 === 0

  const getVisibleCards = _.filter(
    elem => !_.isEmpty(elem.data) || !_.isNil(elem.children)
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
      value: ifNotNull(rawDob, moment.utc(rawDob).format('YYYY-MM-DD')),
      component: TextInput
    },
    {
      name: 'age',
      label: 'Age',
      value: ifNotNull(
        rawDob,
        moment.utc().diff(moment.utc(rawDob).format('YYYY-MM-DD'), 'years')
      ),
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
      value: ifNotNull(
        rawExpirationDate,
        moment.utc(rawExpirationDate).format('YYYY-MM-DD')
      ),
      component: TextInput
    }
  ]

  const usSsnElements = [
    {
      name: 'us ssn',
      label: 'US SSN',
      value: `${customer.usSsn ?? ''}`,
      component: TextInput,
      size: 190
    }
  ]

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
    }
  }

  const cards = [
    {
      data: getAvailableFields(idScanElements),
      title: 'ID Scan',
      titleIcon: <PhoneIcon className={classes.cardIcon} />,
      state: R.path(['idCardDataOverride'])(customer),
      authorize: () =>
        updateCustomer({ idCardDataOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ idCardDataOverride: OVERRIDE_REJECTED }),
      save: values => console.log(values),
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
      save: () => {},
      children: <Info3>{sanctionsDisplay}</Info3>
    },
    {
      title: 'Front facing camera',
      titleIcon: <EditIcon className={classes.editIcon} />,
      state: R.path(['frontCameraOverride'])(customer),
      authorize: () =>
        updateCustomer({ frontCameraOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ frontCameraOverride: OVERRIDE_REJECTED }),
      save: () => {},
      children: customer.frontCameraPath ? (
        <Photo
          show={customer.frontCameraPath}
          src={`${URI}/front-camera-photo/${R.path(['frontCameraPath'])(
            customer
          )}`}
        />
      ) : null
    },
    {
      title: 'ID card image',
      titleIcon: <EditIcon className={classes.editIcon} />,
      state: R.path(['idCardPhotoOverride'])(customer),
      authorize: () =>
        updateCustomer({ idCardPhotoOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ idCardPhotoOverride: OVERRIDE_REJECTED }),
      save: () => {},
      children: customer.idCardPhotoPath ? (
        <Photo
          show={customer.idCardPhotoPath}
          src={`${URI}/id-card-photo/${R.path(['idCardPhotoPath'])(customer)}`}
        />
      ) : null
    },
    {
      data: getAvailableFields(usSsnElements),
      title: 'US SSN',
      titleIcon: <CardIcon className={classes.cardIcon} />,
      state: R.path(['usSsnOverride'])(customer),
      authorize: () => updateCustomer({ usSsnOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ usSsnOverride: OVERRIDE_REJECTED }),
      save: () => {},
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
      data,
      save,
      children,
      validationSchema,
      initialValues
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
        data={data}
        children={children}
        validationSchema={validationSchema}
        initialValues={initialValues}
        save={save}></EditableCard>
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
        {!listView && (
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
            <div className={classes.separator}>{'Custom data entry'}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerData
