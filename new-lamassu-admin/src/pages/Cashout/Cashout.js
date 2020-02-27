import { makeStyles } from '@material-ui/core'
import { useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import React, { useState } from 'react'

import { Switch } from 'src/components/inputs'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'
import { P, Info2 } from 'src/components/typography'
import { spacer, zircon } from 'src/styling/variables'
import Modal from 'src/components/Modal'

import Table from '../../components/cashout-table/Table'
import Title from '../../components/Title'
import { mainStyles } from '../Transactions/Transactions.styles'
import commonStyles from '../common.styles'

import WizardSplash from './WizardSplash'
import Wizard from './Wizard'

const GET_MACHINES_AND_CONFIG = gql`
  {
    machines {
      name
      deviceId
      cashbox
      cassette1
      cassette2
    }
    config
  }
`

const useStyles = makeStyles({
  ...mainStyles,
  commonStyles,
  help: {
    width: 20,
    height: 20,
    marginLeft: spacer * 2
  },
  disabledDrawing: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    '& > div': {
      position: 'absolute',
      backgroundColor: zircon,
      height: 36,
      width: 678
    }
  },
  modal: {
    width: 544
  },
  switchErrorMessage: {
    margin: [['auto', 0, 'auto', 20]]
  }
})

const Cashboxes = () => {
  const [machines, setMachines] = useState([])
  const [modalContent, setModalContent] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const classes = useStyles()

  useQuery(GET_MACHINES_AND_CONFIG, {
    onCompleted: data =>
      setMachines(
        data.machines.map(m => ({
          ...m,
          currency: data.config.fiatCurrency ?? { code: 'N/D' },
          cashOutDenominations: (data.config.cashOutDenominations ?? {})[
            m.deviceId
          ],
          overrides: { top: {}, bottom: {} }
        }))
      )
  })

  const handleEnable = machine => event => {
    setModalContent(
      <WizardSplash
        handleModalNavigation={handleModalNavigation(machine)}
        machine={machine}
      />
    )
    setModalOpen(true)
  }

  const handleEditClick = row => {
    setModalOpen(true)
    handleModalNavigation(row)(1)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setModalContent(null)
  }

  const handleModalNavigation = machine => currentPage => {
    switch (currentPage) {
      case 1:
        setModalContent(
          <Wizard
            handleModalNavigation={handleModalNavigation}
            pageName="Edit Cassette 1 (Top)"
            machine={machine}
            currentStage={1}
          />
        )
        break
      case 2:
        setModalContent(
          <Wizard
            machine={machine}
            handleModalNavigation={handleModalNavigation}
            pageName="Edit Cassette 2"
            currentStage={2}
          />
        )
        break
      case 3:
        setModalContent(
          <Wizard
            machine={machine}
            handleModalNavigation={handleModalNavigation}
            pageName="Cashout Bill Count"
            currentStage={3}
          />
        )
        break
      case 4:
        // save
        return Promise.resolve().then(m => {
          alert('uju')
          setModalOpen(false)
          setModalContent(null)
        })
      default:
        break
    }

    return new Promise(() => {})
  }

  const elements = [
    {
      header: 'Machine',
      size: 254,
      textAlign: 'left',
      view: m => m.name
    },
    {
      header: 'Cassette 1 (Top)',
      size: 265,
      textAlign: 'left',
      view: ({ cashOutDenominations, currency }) => (
        <>
          {cashOutDenominations && cashOutDenominations.top && (
            <Info2>
              {cashOutDenominations.top} {currency.code}
            </Info2>
          )}
        </>
      )
    },
    {
      header: 'Cassette 2',
      size: 265,
      textAlign: 'left',
      view: ({ cashOutDenominations, currency }) => (
        <>
          {cashOutDenominations && cashOutDenominations.bottom && (
            <Info2>
              {cashOutDenominations.bottom} {currency.code}
            </Info2>
          )}
        </>
      )
    },
    {
      header: 'Edit',
      size: 265,
      textAlign: 'left'
    },
    {
      header: 'Enable',
      size: 151,
      textAlign: 'right'
    }
  ]

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Cash-out</Title>
        </div>
        <div>
          <P>
            Transaction fudge factor <Switch checked={true} /> On{' '}
            <HelpIcon className={classes.help} />
          </P>
        </div>
      </div>
      <Table
        elements={elements}
        data={machines}
        handleEnable={handleEnable}
        handleEditClick={handleEditClick}
      />
      <Modal
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        open={modalOpen}
        handleClose={handleModalClose}
        className={classes.modal}>
        {modalContent}
      </Modal>
    </>
  )
}

export default Cashboxes
