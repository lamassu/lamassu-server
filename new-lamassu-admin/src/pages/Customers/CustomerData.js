import { Box, CardContent, Card } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import moment from 'moment'
import * as R from 'ramda'
import { useState, React } from 'react'

import { Tooltip } from 'src/components/Tooltip'
import { SubpageButton } from 'src/components/buttons'
import { H3 } from 'src/components/typography'
import { ReactComponent as CardIcon } from 'src/styling/icons/ID/card/comet.svg'
import { ReactComponent as PhoneIcon } from 'src/styling/icons/ID/phone/comet.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/disabled.svg'
import { ReactComponent as ReverseListingViewIcon } from 'src/styling/icons/circle buttons/listing-view/white.svg'
import { ReactComponent as ListingViewIcon } from 'src/styling/icons/circle buttons/listing-view/zodiac.svg'
import { ifNotNull } from 'src/utils/nullCheck'

import styles from './CustomerData.styles.js'
import { Field } from './components'
import { getName } from './helper.js'

const useStyles = makeStyles(styles)

const CustomerData = ({ customer, updateCustomer }) => {
  const classes = useStyles()

  const idData = R.path(['idCardData'])(customer)
  const rawExpirationDate = R.path(['expirationDate'])(idData)
  const country = R.path(['country'])(idData)
  const rawDob = R.path(['dateOfBirth'])(idData)

  const nameElements = [
    {
      header: 'Name',
      display: `${getName(customer)}`,
      size: 190
    }
  ]

  const idScanElementsFirstRow = [
    {
      header: 'Name',
      display: `${getName(customer)}`,
      size: 190
    },
    {
      header: 'ID number',
      display: R.path(['documentNumber'])(idData),
      size: 160
    },
    {
      header: 'Age',
      display: ifNotNull(
        rawDob,
        moment.utc().diff(moment.utc(rawDob).format('YYYY-MM-DD'), 'years')
      ),
      size: 50
    }
  ]
  const idScanElementsSecondRow = [
    {
      header: 'Gender',
      display: R.path(['gender'])(idData),
      size: 80
    },
    {
      header: country === 'Canada' ? 'Province' : 'State',
      display: R.path(['state'])(idData),
      size: 120
    },
    {
      header: 'Expiration Date',
      display: ifNotNull(
        rawExpirationDate,
        moment.utc(rawExpirationDate).format('YYYY-MM-DD')
      )
    }
  ]

  const [listView, setListView] = useState(false)

  return (
    <div>
      <div className={classes.header}>
        <H3 className={classes.title}>{'Customer data'}</H3>
        <SubpageButton
          className={classes.subpageButton}
          Icon={ListingViewIcon}
          InverseIcon={ReverseListingViewIcon}
          toggle={setListView}></SubpageButton>
      </div>
      <div>
        {listView && <H3>{''}</H3>}
        {!listView && (
          <Grid container>
            <Grid container direction="column" item xs={6}>
              <Card className={classes.leftSideCard}>
                <CardContent>
                  <div className={classes.cardHeader}>
                    <EditIcon className={classes.editIcon} />
                    <H3 className={classes.cardTitle}>{'Name'}</H3>
                    <Tooltip width={304}></Tooltip>
                  </div>
                  <Box display="flex" alignItems="center">
                    {nameElements.map(({ header, display, size }, idx) => (
                      <Field
                        key={idx}
                        label={header}
                        display={display}
                        size={size}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
              <Card className={classes.leftSideCard}>
                <CardContent>
                  <div className={classes.cardHeader}>
                    <PhoneIcon className={classes.cardIcon} />
                    <H3 className={classes.cardTitle}>{'ID Scan'}</H3>
                    <Tooltip width={304}></Tooltip>
                  </div>
                  <Box display="flex" alignItems="center">
                    {idScanElementsFirstRow.map(
                      ({ header, display, size }, idx) => (
                        <Field
                          key={idx}
                          label={header}
                          display={display}
                          size={size}
                        />
                      )
                    )}
                  </Box>
                  <Box display="flex" alignItems="center">
                    {idScanElementsSecondRow.map(
                      ({ header, display, size }, idx) => (
                        <Field
                          key={idx}
                          label={header}
                          display={display}
                          size={size}
                        />
                      )
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid container direction="column" item xs={6}>
              <Card className={classes.rightSideCard}>
                <CardContent>
                  <div className={classes.cardHeader}>
                    <CardIcon className={classes.cardIcon} />
                    <H3 className={classes.cardTitle}>{'SMS Confirmation'}</H3>
                    <Tooltip width={304}></Tooltip>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </div>
    </div>
  )
}

export default CustomerData
