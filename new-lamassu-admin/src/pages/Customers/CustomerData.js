import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import { parse, format } from 'date-fns/fp'
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
import {
  customerDataElements,
  customerDataSchemas,
  formatDates,
  getFormattedPhone
} from './helper.js'

const useStyles = makeStyles(styles)

const IMAGE_WIDTH = 165
const IMAGE_HEIGHT = 32
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
  locale,
  customer,
  updateCustomer,
  replacePhoto,
  editCustomer,
  deleteEditedData,
  updateCustomRequest,
  authorizeCustomRequest,
  updateCustomEntry
}) => {
  const classes = useStyles()
  const [listView, setListView] = useState(false)

  const idData = R.path(['idCardData'])(customer)
  const rawExpirationDate = R.path(['expirationDate'])(idData)
  const rawDob = R.path(['dateOfBirth'])(idData)

  const sanctions = R.path(['sanctions'])(customer)
  const sanctionsAt = R.path(['sanctionsAt'])(customer)
  const sanctionsDisplay = !sanctionsAt
    ? 'Not checked yet'
    : sanctions
    ? 'Passed'
    : 'Failed'

  const sortByName = R.sortBy(
    R.compose(R.toLower, R.path(['customInfoRequest', 'customRequest', 'name']))
  )

  const customFields = []
  const customRequirements = []
  const customInfoRequests = sortByName(
    R.path(['customInfoRequests'])(customer) ?? []
  )

  const phone = R.path(['phone'])(customer)
  const smsData = R.path(['subscriberInfo'])(customer)

  const isEven = elem => elem % 2 === 0

  const getVisibleCards = _.filter(elem => elem.isAvailable)

  const initialValues = {
    idCardData: {
      firstName: R.path(['firstName'])(idData) ?? '',
      lastName: R.path(['lastName'])(idData) ?? '',
      documentNumber: R.path(['documentNumber'])(idData) ?? '',
      dateOfBirth:
        (rawDob &&
          format('yyyy-MM-dd')(parse(new Date(), 'yyyyMMdd', rawDob))) ??
        '',
      gender: R.path(['gender'])(idData) ?? '',
      country: R.path(['country'])(idData) ?? '',
      expirationDate:
        (rawExpirationDate &&
          format('yyyy-MM-dd')(
            parse(new Date(), 'yyyyMMdd', rawExpirationDate)
          )) ??
        ''
    },
    usSsn: {
      usSsn: customer.usSsn ?? ''
    },
    frontCamera: {
      frontCamera: null
    },
    idCardPhoto: {
      idCardPhoto: null
    },
    smsData: {
      phoneNumber: getFormattedPhone(phone, locale.country)
    }
  }

  const cards = [
    {
      fields: customerDataElements.idCardData,
      title: 'ID Scan',
      titleIcon: <CardIcon className={classes.cardIcon} />,
      state: R.path(['idCardDataOverride'])(customer),
      authorize: () =>
        updateCustomer({ idCardDataOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ idCardDataOverride: OVERRIDE_REJECTED }),
      deleteEditedData: () => deleteEditedData({ idCardData: null }),
      save: values =>
        editCustomer({
          idCardData: _.merge(idData, formatDates(values))
        }),
      validationSchema: customerDataSchemas.idCardData,
      initialValues: initialValues.idCardData,
      isAvailable: !_.isNil(idData)
    },
    {
      fields: customerDataElements.smsData,
      title: 'SMS data',
      titleIcon: <PhoneIcon className={classes.cardIcon} />,
      authorize: () => {},
      reject: () => {},
      save: () => {},
      validationSchema: customerDataSchemas.smsData,
      initialValues: initialValues.smsData,
      isAvailable: !_.isNil(phone),
      isDeletable: !_.isNil(smsData) || !_.isEmpty(smsData.result)
    },
    {
      title: 'Name',
      titleIcon: <EditIcon className={classes.editIcon} />,
      authorize: () => {},
      reject: () => {},
      save: () => {},
      isAvailable: false
    },
    {
      title: 'Sanctions check',
      titleIcon: <EditIcon className={classes.editIcon} />,
      state: R.path(['sanctionsOverride'])(customer),
      authorize: () =>
        updateCustomer({ sanctionsOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ sanctionsOverride: OVERRIDE_REJECTED }),
      children: <Info3>{sanctionsDisplay}</Info3>,
      isAvailable: !_.isNil(sanctions)
    },
    {
      fields: customerDataElements.frontCamera,
      title: 'Front facing camera',
      titleIcon: <EditIcon className={classes.editIcon} />,
      state: R.path(['frontCameraOverride'])(customer),
      authorize: () =>
        updateCustomer({ frontCameraOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ frontCameraOverride: OVERRIDE_REJECTED }),
      save: values =>
        replacePhoto({
          newPhoto: values.frontCamera,
          photoType: 'frontCamera'
        }),
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
      validationSchema: customerDataSchemas.frontCamera,
      initialValues: initialValues.frontCamera,
      isAvailable: !_.isNil(customer.frontCameraPath)
    },
    {
      fields: customerDataElements.idCardPhoto,
      title: 'ID card image',
      titleIcon: <EditIcon className={classes.editIcon} />,
      state: R.path(['idCardPhotoOverride'])(customer),
      authorize: () =>
        updateCustomer({ idCardPhotoOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ idCardPhotoOverride: OVERRIDE_REJECTED }),
      save: values =>
        replacePhoto({
          newPhoto: values.idCardPhoto,
          photoType: 'idCardPhoto'
        }),
      deleteEditedData: () => deleteEditedData({ idCardPhoto: null }),
      children: customer.idCardPhotoPath ? (
        <Photo
          show={customer.idCardPhotoPath}
          src={`${URI}/id-card-photo/${R.path(['idCardPhotoPath'])(customer)}`}
        />
      ) : null,
      hasImage: true,
      validationSchema: customerDataSchemas.idCardPhoto,
      initialValues: initialValues.idCardPhoto,
      isAvailable: !_.isNil(customer.idCardPhotoPath)
    },
    {
      fields: customerDataElements.usSsn,
      title: 'US SSN',
      titleIcon: <CardIcon className={classes.cardIcon} />,
      state: R.path(['usSsnOverride'])(customer),
      authorize: () => updateCustomer({ usSsnOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ usSsnOverride: OVERRIDE_REJECTED }),
      save: values => editCustomer(values),
      deleteEditedData: () => deleteEditedData({ usSsn: null }),
      validationSchema: customerDataSchemas.usSsn,
      initialValues: initialValues.usSsn,
      isAvailable: !_.isNil(customer.usSsn)
    }
  ]

  R.forEach(it => {
    customRequirements.push({
      fields: [
        {
          name: it.customInfoRequest.id,
          label: it.customInfoRequest.customRequest.name,
          value: it.customerData.data ?? '',
          component: TextInput
        }
      ],
      title: it.customInfoRequest.customRequest.name,
      titleIcon: <CardIcon className={classes.cardIcon} />,
      state: R.path(['override'])(it),
      authorize: () =>
        authorizeCustomRequest({
          variables: {
            customerId: it.customerId,
            infoRequestId: it.customInfoRequest.id,
            override: OVERRIDE_AUTHORIZED
          }
        }),
      reject: () =>
        authorizeCustomRequest({
          variables: {
            customerId: it.customerId,
            infoRequestId: it.customInfoRequest.id,
            override: OVERRIDE_REJECTED
          }
        }),
      save: values => {
        updateCustomRequest({
          variables: {
            customerId: it.customerId,
            infoRequestId: it.customInfoRequest.id,
            data: {
              info_request_id: it.customInfoRequest.id,
              data: values[it.customInfoRequest.id]
            }
          }
        })
      },
      deleteEditedData: () => {},
      validationSchema: Yup.object().shape({
        [it.customInfoRequest.id]: Yup.string()
      }),
      initialValues: {
        [it.customInfoRequest.id]: it.customerData.data ?? ''
      }
    })
  }, customInfoRequests)

  R.forEach(it => {
    customFields.push({
      fields: [
        {
          name: it.label,
          label: it.label,
          value: it.value ?? '',
          component: TextInput
        }
      ],
      title: it.label,
      titleIcon: <EditIcon className={classes.editIcon} />,
      save: values => {
        updateCustomEntry({
          fieldId: it.id,
          value: values[it.label]
        })
      },
      deleteEditedData: () => {},
      validationSchema: Yup.object().shape({
        [it.label]: Yup.string()
      }),
      initialValues: {
        [it.label]: it.value ?? ''
      }
    })
  }, R.path(['customFields'])(customer) ?? [])

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
        {// TODO: Remove false condition for next release
        false && (
          <>
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
          </>
        )}
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
        {!_.isEmpty(customFields) && (
          <div className={classes.wrapper}>
            <span className={classes.separator}>Custom data entry</span>
            <Grid container>
              <Grid container direction="column" item xs={6}>
                {customFields.map((elem, idx) => {
                  return isEven(idx) ? editableCard(elem, idx) : null
                })}
              </Grid>
              <Grid container direction="column" item xs={6}>
                {customFields.map((elem, idx) => {
                  return !isEven(idx) ? editableCard(elem, idx) : null
                })}
              </Grid>
            </Grid>
          </div>
        )}
        {!R.isEmpty(customRequirements) && (
          <div className={classes.wrapper}>
            <span className={classes.separator}>Custom requirements</span>
            <Grid container>
              <Grid container direction="column" item xs={6}>
                {customRequirements.map((elem, idx) => {
                  return isEven(idx) ? editableCard(elem, idx) : null
                })}
              </Grid>
              <Grid container direction="column" item xs={6}>
                {customRequirements.map((elem, idx) => {
                  return !isEven(idx) ? editableCard(elem, idx) : null
                })}
              </Grid>
            </Grid>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerData
