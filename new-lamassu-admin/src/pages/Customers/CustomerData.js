import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import { parse, format } from 'date-fns/fp'
import * as R from 'ramda'
import { useState, React } from 'react'
import * as Yup from 'yup'

import ImagePopper from 'src/components/ImagePopper'
import { FeatureButton } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import { H3, Info3 } from 'src/components/typography'
import {
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED,
  OVERRIDE_PENDING
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
import { onlyFirstToUpper } from 'src/utils/string'

import styles from './CustomerData.styles.js'
import { EditableCard, NonEditableCard } from './components'
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
  customer = {},
  updateCustomer,
  replacePhoto,
  editCustomer,
  deleteEditedData,
  updateCustomRequest,
  authorizeCustomRequest,
  updateCustomEntry,
  retrieveAdditionalDataDialog,
  setRetrieve,
  checkAgainstSanctions
}) => {
  const classes = useStyles()
  const [listView, setListView] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const [previewCard, setPreviewCard] = useState(null)

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
  const externalCompliance = []

  const phone = R.path(['phone'])(customer)
  const smsData = R.path(['subscriberInfo'])(customer)

  const isEven = elem => elem % 2 === 0

  const getVisibleCards = R.filter(elem => elem.isAvailable)

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

  const smsDataElements = [
    {
      name: 'phoneNumber',
      label: 'Phone number',
      component: TextInput,
      editable: false
    }
  ]

  const smsDataSchema = {
    smsData: Yup.lazy(values => {
      const additionalData = R.omit(['phoneNumber'])(values)
      const fields = R.keys(additionalData)
      if (R.length(fields) === 2) {
        return Yup.object().shape({
          [R.head(fields)]: Yup.string().required(),
          [R.last(fields)]: Yup.string().required()
        })
      }
    })
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
          idCardData: R.merge(idData, formatDates(values))
        }),
      validationSchema: customerDataSchemas.idCardData,
      checkAgainstSanctions: () =>
        checkAgainstSanctions({
          variables: {
            customerId: R.path(['id'])(customer)
          }
        }),
      initialValues: initialValues.idCardData,
      isAvailable: !R.isNil(idData),
      editable: true
    },
    {
      fields: smsDataElements,
      title: 'SMS data',
      titleIcon: <PhoneIcon className={classes.cardIcon} />,
      state: R.path(['phoneOverride'])(customer),
      authorize: () => updateCustomer({ phoneOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ phoneOverride: OVERRIDE_REJECTED }),
      save: values => {
        editCustomer({
          subscriberInfo: {
            result: R.merge(smsData, R.omit(['phoneNumber'])(values))
          }
        })
      },
      validationSchema: smsDataSchema.smsData,
      retrieveAdditionalData: () => setRetrieve(true),
      initialValues: initialValues.smsData,
      isAvailable: !R.isNil(phone),
      hasAdditionalData: !R.isNil(smsData) && !R.isEmpty(smsData),
      editable: false
    },
    {
      title: 'Name',
      titleIcon: <EditIcon className={classes.editIcon} />,
      isAvailable: false,
      editable: true
    },
    {
      title: 'Sanctions check',
      titleIcon: <EditIcon className={classes.editIcon} />,
      state: R.path(['sanctionsOverride'])(customer),
      authorize: () =>
        updateCustomer({ sanctionsOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ sanctionsOverride: OVERRIDE_REJECTED }),
      children: () => <Info3>{sanctionsDisplay}</Info3>,
      isAvailable: !R.isNil(sanctions),
      editable: true
    },
    {
      fields: customerDataElements.frontCamera,
      title: 'Front facing camera',
      titleIcon: <EditIcon className={classes.editIcon} />,
      state: R.path(['frontCameraOverride'])(customer),
      authorize: () =>
        updateCustomer({ frontCameraOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ frontCameraOverride: OVERRIDE_REJECTED }),
      save: values => {
        setPreviewPhoto(null)
        return replacePhoto({
          newPhoto: values.frontCamera,
          photoType: 'frontCamera'
        })
      },
      cancel: () => setPreviewPhoto(null),
      deleteEditedData: () => deleteEditedData({ frontCamera: null }),
      children: values => {
        if (values.frontCamera !== previewPhoto) {
          setPreviewPhoto(values.frontCamera)
        }

        return customer.frontCameraPath ? (
          <Photo
            show={customer.frontCameraPath}
            src={
              !R.isNil(previewPhoto)
                ? URL.createObjectURL(previewPhoto)
                : `${URI}/front-camera-photo/${R.path(['frontCameraPath'])(
                    customer
                  )}`
            }
          />
        ) : null
      },
      hasImage: true,
      validationSchema: customerDataSchemas.frontCamera,
      initialValues: initialValues.frontCamera,
      isAvailable: !R.isNil(customer.frontCameraPath),
      editable: true
    },
    {
      fields: customerDataElements.idCardPhoto,
      title: 'ID card image',
      titleIcon: <EditIcon className={classes.editIcon} />,
      state: R.path(['idCardPhotoOverride'])(customer),
      authorize: () =>
        updateCustomer({ idCardPhotoOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ idCardPhotoOverride: OVERRIDE_REJECTED }),
      save: values => {
        setPreviewCard(null)
        return replacePhoto({
          newPhoto: values.idCardPhoto,
          photoType: 'idCardPhoto'
        })
      },
      cancel: () => setPreviewCard(null),
      deleteEditedData: () => deleteEditedData({ idCardPhoto: null }),
      children: values => {
        if (values.idCardPhoto !== previewCard) {
          setPreviewCard(values.idCardPhoto)
        }

        return customer.idCardPhotoPath ? (
          <Photo
            show={customer.idCardPhotoPath}
            src={
              !R.isNil(previewCard)
                ? URL.createObjectURL(previewCard)
                : `${URI}/id-card-photo/${R.path(['idCardPhotoPath'])(
                    customer
                  )}`
            }
          />
        ) : null
      },
      hasImage: true,
      validationSchema: customerDataSchemas.idCardPhoto,
      initialValues: initialValues.idCardPhoto,
      isAvailable: !R.isNil(customer.idCardPhotoPath),
      editable: true
    },
    {
      fields: customerDataElements.usSsn,
      title: 'US SSN',
      titleIcon: <CardIcon className={classes.cardIcon} />,
      state: R.path(['usSsnOverride'])(customer),
      authorize: () => updateCustomer({ usSsnOverride: OVERRIDE_AUTHORIZED }),
      reject: () => updateCustomer({ usSsnOverride: OVERRIDE_REJECTED }),
      save: values => editCustomer(values),
      children: () => {},
      deleteEditedData: () => deleteEditedData({ usSsn: null }),
      validationSchema: customerDataSchemas.usSsn,
      initialValues: initialValues.usSsn,
      isAvailable: !R.isNil(customer.usSsn),
      editable: true
    }
  ]

  R.forEach(it => {
    customRequirements.push({
      fields: [
        {
          name: it.customInfoRequest.id,
          label: it.customInfoRequest.customRequest.name,
          value: it.customerData.data ?? '',
          component: TextInput,
          editable: true
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
          component: TextInput,
          editable: true
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

  R.forEach(it => {
    initialValues.smsData[it] = smsData[it]
    smsDataElements.push({
      name: it,
      label: onlyFirstToUpper(it),
      component: TextInput,
      editable: false
    })
  }, R.keys(smsData) ?? [])

  const externalComplianceProvider =
    R.path([`externalCompliance`, `provider`])(customer) ?? undefined

  const externalComplianceData = {
    sumsub: {
      getApplicantInfo: data => {
        return R.path(['fixedInfo'])(data) ?? {}
      },
      getVerificationState: data => {
        const reviewStatus = R.path(['review', 'reviewStatus'])(data)
        const reviewResult = R.path(['review', 'reviewResult', 'reviewAnswer'])(
          data
        )

        const state =
          reviewStatus === 'completed'
            ? reviewResult === 'GREEN'
              ? OVERRIDE_AUTHORIZED
              : OVERRIDE_REJECTED
            : OVERRIDE_PENDING

        const comment = R.path(['review', 'reviewResult', 'clientComment'])(
          data
        )

        const labels = R.path(['review', 'reviewResult', 'rejectLabels'])(data)

        return { state, comment, labels }
      }
    }
  }

  const externalComplianceValues = R.path(['externalCompliance'])(customer)

  if (
    !R.isNil(externalComplianceValues) &&
    !R.isEmpty(externalComplianceValues)
  ) {
    externalCompliance.push({
      fields: R.map(it => ({ name: it[0], label: it[0], value: it[1] }))(
        R.toPairs(
          externalComplianceData[externalComplianceProvider]?.getApplicantInfo(
            externalComplianceValues
          )
        )
      ),
      titleIcon: <CardIcon className={classes.cardIcon} />,
      state: externalComplianceData[
        externalComplianceProvider
      ]?.getVerificationState(externalComplianceValues),
      title: 'External Info'
    })
  }

  const editableCard = (
    {
      title,
      authorize,
      reject,
      state,
      titleIcon,
      fields,
      save,
      cancel,
      deleteEditedData,
      retrieveAdditionalData,
      children,
      validationSchema,
      initialValues,
      hasImage,
      hasAdditionalData,
      editable,
      checkAgainstSanctions
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
        hasAdditionalData={hasAdditionalData}
        fields={fields}
        children={children}
        validationSchema={validationSchema}
        initialValues={initialValues}
        save={save}
        cancel={cancel}
        deleteEditedData={deleteEditedData}
        retrieveAdditionalData={retrieveAdditionalData}
        checkAgainstSanctions={checkAgainstSanctions}
        editable={editable}></EditableCard>
    )
  }

  const nonEditableCard = (
    { title, state, titleIcon, fields, hasImage },
    idx
  ) => {
    return (
      <NonEditableCard
        title={title}
        key={idx}
        state={state}
        titleIcon={titleIcon}
        hasImage={hasImage}
        fields={fields}></NonEditableCard>
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
        {!R.isEmpty(customFields) && (
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
        {!R.isEmpty(externalCompliance) && (
          <div className={classes.wrapper}>
            <span className={classes.separator}>
              External compliance information
            </span>
            <Grid container>
              <Grid container direction="column" item xs={6}>
                {externalCompliance.map((elem, idx) => {
                  return isEven(idx) ? nonEditableCard(elem, idx) : null
                })}
              </Grid>
              <Grid container direction="column" item xs={6}>
                {externalCompliance.map((elem, idx) => {
                  return !isEven(idx) ? nonEditableCard(elem, idx) : null
                })}
              </Grid>
            </Grid>
          </div>
        )}
      </div>
      {retrieveAdditionalDataDialog}
    </div>
  )
}

export default CustomerData
