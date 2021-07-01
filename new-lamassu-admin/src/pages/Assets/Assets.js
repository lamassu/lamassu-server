import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'

// import moment from 'moment'
// import React from 'react'
// import { Tooltip } from 'src/components/Tooltip'
import TitleSection from 'src/components/layout/TitleSection'
// import DataTable from 'src/components/tables/DataTable'
import { H4 } from 'src/components/typography'

import styles from './Assets.styles'
const useStyles = makeStyles(styles)

const Assets = () => {
  const classes = useStyles()

  return (
    <>
      <TitleSection title="Balance sheet" />
      <H4>{'future page'}</H4>
      <div className={classes.root}>
        <Grid container>
          <Grid container direction="column" item xs={6}>
            {/* <LeftSide /> */}
          </Grid>
          <Grid container direction="column" item xs={6}>
            {/* <RightSide /> */}
          </Grid>
        </Grid>
      </div>
    </>
  )
}

export default Assets
