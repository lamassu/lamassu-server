import React, { useState } from 'react'
import { makeStyles, Modal, Paper } from '@material-ui/core'

import Title from 'src/components/Title'
import { FeatureButton, Link } from 'src/components/buttons'
import { Table as EditableTable } from 'src/components/editableTable'
import { ReactComponent as ConfigureInverseIcon } from 'src/styling/icons/button/configure/white.svg'
import { ReactComponent as Configure } from 'src/styling/icons/button/configure/zodiac.svg'

import { NewTriggerWizard } from './NewTriggerWizard'
import { mainStyles } from './Triggers.styles'

const useStyles = makeStyles(mainStyles)

const sizes = {
  triggerType: 236,
  requirement: 293,
  threshold: 231,
  cashDirection: 296
}

const Triggers = () => {
  const [wizardModalOpen, setWizardModalOpen] = useState(false)

  const classes = useStyles()

  const handleOpenWizard = () => {
    setWizardModalOpen(true)
  }

  const handleCloseWizard = () => {
    handleFinishWizard()
  }

  const handleFinishWizard = () => {
    setWizardModalOpen(false)
  }

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
            />
          </div>
        </div>
        <div className={classes.headerLabels}>
          <Link color="primary" onClick={handleOpenWizard}>
            + Add new trigger
          </Link>
        </div>
      </div>
      <EditableTable
        data={[]}
        elements={[
          {
            name: 'triggerType',
            size: sizes.triggerType
          },
          {
            name: 'requirement',
            size: sizes.requirement
          },
          {
            name: 'threshold',
            size: sizes.threshold
          },
          {
            name: 'cashDirection',
            size: sizes.cashDirection
          }
        ]}
      />
      {wizardModalOpen && (
        <Modal
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
          open={wizardModalOpen}
          onClose={handleCloseWizard}
          className={classes.modal}>
          <Paper className={classes.paper}>
            <NewTriggerWizard
              close={handleCloseWizard}
              finish={handleFinishWizard}
            />
          </Paper>
        </Modal>
      )}
    </>
  )
}

export default Triggers
