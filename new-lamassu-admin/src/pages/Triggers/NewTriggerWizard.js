import React, { useState } from 'react'
import { useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import { makeStyles } from '@material-ui/core'

import { Wizard } from 'src/components/wizard'
import { H2, P } from 'src/components/typography'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import Popper from 'src/components/Popper'

import SelectTriggerDirection from './SelectTriggerDirection'
import SelectTriggerType from './SelectTriggerType'
import SelectTriggerRequirements from './SelectTriggerRequirements'
import { mainStyles } from './Triggers.styles'

const useStyles = makeStyles(mainStyles)

const GET_CONFIG = gql`
  {
    config
  }
`

const NewTriggerWizard = ({ close, finish }) => {
  const { data: configResponse } = useQuery(GET_CONFIG)
  const [helpPopperAnchorEl, setHelpPopperAnchorEl] = useState(null)

  const classes = useStyles()

  const fiatCurrencyCode = configResponse?.config?.['locale_fiatCurrency']?.code

  const handleOpenHelpPopper = event => {
    setHelpPopperAnchorEl(helpPopperAnchorEl ? null : event.currentTarget)
  }

  const handleCloseHelpPopper = () => {
    setHelpPopperAnchorEl(null)
  }

  const helpPopperOpen = Boolean(helpPopperAnchorEl)

  const wizardHeader = (
    <div className={classes.rowWrapper}>
      <H2 className={classes.wizardHeaderText}>New Compliance Trigger</H2>
      <div className={classes.transparentButton}>
        <button onClick={handleOpenHelpPopper}>
          <HelpIcon />
          <Popper
            open={helpPopperOpen}
            anchorEl={helpPopperAnchorEl}
            placement="bottom"
            onClose={handleCloseHelpPopper}>
            <div className={classes.popoverContent}>
              <P>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
                tempor velit a dolor ultricies posuere. Proin massa sapien,
                euismod quis auctor vel, blandit in enim.
              </P>
            </div>
          </Popper>
        </button>
      </div>
      <div className={classes.transparentButton}>
        <button onClick={close}>
          <CloseIcon className={classes.closeButton} />
        </button>
      </div>
    </div>
  )

  return (
    <Wizard
      header={wizardHeader}
      nextStepText={'Next'}
      finalStepText={'Add Trigger'}
      finish={finish}>
      <SelectTriggerDirection />
      <SelectTriggerType fiatCurrencyCode={fiatCurrencyCode} />
      <SelectTriggerRequirements />
    </Wizard>
  )
}

export { NewTriggerWizard }
