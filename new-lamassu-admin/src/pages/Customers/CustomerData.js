import { CardContent, Card } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import moment from 'moment'
import * as R from 'ramda'
import { useState, React } from 'react'

import { Tooltip } from 'src/components/Tooltip'
import { FeatureButton } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import { H3 } from 'src/components/typography'
import { ReactComponent as CardIcon } from 'src/styling/icons/ID/card/comet.svg'
import { ReactComponent as PhoneIcon } from 'src/styling/icons/ID/phone/comet.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/comet.svg'
import { ReactComponent as CustomerListViewReversedIcon } from 'src/styling/icons/circle buttons/customer-list-view/white.svg'
import { ReactComponent as CustomerListViewIcon } from 'src/styling/icons/circle buttons/customer-list-view/zodiac.svg'
import { ReactComponent as OverviewReversedIcon } from 'src/styling/icons/circle buttons/overview/white.svg'
import { ReactComponent as OverviewIcon } from 'src/styling/icons/circle buttons/overview/zodiac.svg'
import { ifNotNull } from 'src/utils/nullCheck'

import styles from './CustomerData.styles.js'
import { EditableCard } from './components'
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
      name: 'name',
      label: 'Name',
      value: `${getName(customer)}` ?? '',
      component: TextInput,
      size: 190
    }
  ]

  const idScanElements = [
    {
      name: 'name',
      label: 'Name',
      value: `${getName(customer)}`,
      component: TextInput,
      size: 190
    },
    {
      name: 'ID number',
      label: 'ID number',
      value: R.path(['documentNumber'])(idData),
      component: TextInput,
      size: 160
    },
    {
      name: 'age',
      label: 'Age',
      value: ifNotNull(
        rawDob,
        moment.utc().diff(moment.utc(rawDob).format('YYYY-MM-DD'), 'years')
      ),
      component: TextInput,
      size: 50
    },
    {
      name: 'gender',
      label: 'Gender',
      value: R.path(['gender'])(idData),
      component: TextInput,
      size: 80
    },
    {
      name: country === 'Canada' ? 'province' : 'state',
      label: country === 'Canada' ? 'Province' : 'State',
      value: R.path(['state'])(idData),
      component: TextInput,
      size: 120
    },
    {
      name: 'expiration date',
      label: 'Expiration Date',
      value: ifNotNull(
        rawExpirationDate,
        moment.utc(rawExpirationDate).format('YYYY-MM-DD')
      ),
      component: TextInput,
      size: 120
    }
  ]

  const [listView, setListView] = useState(false)

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
          variant="contained"
        />
        <FeatureButton
          active={listView}
          className={classes.viewIcons}
          Icon={CustomerListViewIcon}
          InverseIcon={CustomerListViewReversedIcon}
          onClick={() => setListView(true)}></FeatureButton>
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
                  <EditableCard
                    data={nameElements}
                    save={() => {}}></EditableCard>
                </CardContent>
              </Card>
              <Card className={classes.leftSideCard}>
                <CardContent>
                  <div className={classes.cardHeader}>
                    <PhoneIcon className={classes.cardIcon} />
                    <H3 className={classes.cardTitle}>{'ID Scan'}</H3>
                    <Tooltip width={304}></Tooltip>
                  </div>
                  <EditableCard
                    data={idScanElements}
                    save={() => {}}></EditableCard>
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
