import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import Title from 'src/components/Title'
import { FeatureButton, Link } from 'src/components/buttons'
import { Table as EditableTable } from 'src/components/editableTable'
import { ReactComponent as ConfigureInverseIcon } from 'src/styling/icons/button/configure/white.svg'
import { ReactComponent as Configure } from 'src/styling/icons/button/configure/zodiac.svg'
// import { ReactComponent as Help } from 'src/styling/icons/action/help/white.svg'

import { mainStyles } from './Triggers.styles'

const useStyles = makeStyles(mainStyles)

const sizes = {
  triggerType: 236,
  requirement: 293,
  threshold: 231,
  cashDirection: 296
}

const Triggers = () => {
  const classes = useStyles()

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Compliance Triggers</Title>
          <div className={classes.buttonsWrapper}>
            <FeatureButton
              Icon={Configure}
              InverseIcon={ConfigureInverseIcon}
              variant="contained"
              // onClick={handleAdvanced}
            />
          </div>
        </div>
        <div className={classes.headerLabels}>
          <Link color="primary">Add new trigger</Link>
        </div>
      </div>
      <EditableTable
        // save={save}
        // validationSchema={validationSchema}
        data={[]}
        elements={[
          {
            name: 'triggerType',
            size: sizes.triggerType
            // view: R.path(['display']),
            // input: Autocomplete,
            // inputProps: { suggestions: getData(['countries']) }
          },
          {
            name: 'requirement',
            size: sizes.requirement
            // view: R.path(['code']),
            // input: Autocomplete,
            // inputProps: { suggestions: getData(['currencies']) }
          },
          {
            name: 'threshold',
            size: sizes.threshold
            // view: displayCodeArray,
            // input: AutocompleteMultiple,
            // inputProps: { suggestions: getData(['languages']) }
          },
          {
            name: 'cashDirection',
            size: sizes.cashDirection
            // view: displayCodeArray,
            // input: AutocompleteMultiple,
            // inputProps: { suggestions: getData(['cryptoCurrencies']) }
          }
        ]}
      />
    </>
  )
}

export default Triggers
