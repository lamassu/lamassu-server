import React from 'react'
import classnames from 'classnames'
import moment from 'moment'
import { makeStyles } from '@material-ui/core/styles'
import useAxios from '@use-hooks/axios'

import { detailsRowStyles, labelStyles } from '../Transactions/Transactions.styles'
import { ReactComponent as UnpairIcon } from '../../styling/icons/button/unpair/zodiac.svg'
import { ReactComponent as ShutdownIcon } from '../../styling/icons/button/shut down/zodiac.svg'
import { ReactComponent as RebootIcon } from '../../styling/icons/button/reboot/zodiac.svg'
import { ReactComponent as DownloadIcon } from '../../styling/icons/button/download/zodiac.svg'

import { ReactComponent as UnpairReversedIcon } from '../../styling/icons/button/unpair/white.svg'
import { ReactComponent as ShutdownReversedIcon } from '../../styling/icons/button/shut down/white.svg'
import { ReactComponent as RebootReversedIcon } from '../../styling/icons/button/reboot/white.svg'
import { ReactComponent as DownloadReversedIcon } from '../../styling/icons/button/download/white.svg'

import { Status } from '../../components/Status'
import ActionButton from '../../components/buttons/ActionButton'

const Label = ({ children }) => {
  const useStyles = makeStyles(labelStyles)
  const classes = useStyles()

  return <div className={classes.label}>{children}</div>
}

const MachineDetailsRow = ({ machine, ...props }) => {
  const useStyles = makeStyles(detailsRowStyles)
  const classes = useStyles()

  const { loading: unpairDisabled, reFetch: unpair } = useAxios({
    url: `https://localhost:8070/api/machines/${machine.deviceId}/actions/unpair`,
    method: 'POST'
  })

  const { loading: rebootDisabled, reFetch: reboot } = useAxios({
    url: `https://localhost:8070/api/machines/${machine.deviceId}/actions/reboot`,
    method: 'POST'
  })

  return (
    <>
      <div className={classes.wrapper}>

        <div className={classnames(classes.row)}>
          <div className={classnames(classes.col)}>
            <div className={classnames(classes.row)}>
              <div className={classnames(classes.col, classes.col2)}>
                <div className={classes.innerRow}>
                  <div>
                    <Label>Statuses</Label>
                    <div>
                      {machine.statuses.map((status, index) => <Status status={status} key={index} />)}
                    </div>
                  </div>
                  <div>
                    {/* <div className={classes.commissionWrapper}> */}
                    <Label>Lamassu Support article</Label>
                    <div>
                      {machine.statuses.map((...[, index]) => <span key={index} />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={classnames(classes.col, classes.col2)} style={{ background: '#ebefff', width: '2px' }} />
          <div className={classnames(classes.col)}>
            <div className={classnames(classes.row)}>
              <div className={classnames(classes.col, classes.col2)}>
                <div className={classes.innerRow}>
                  <div>
                    <Label>Machine Model</Label>
                    <div>{machine.machineModel}</div>
                  </div>
                  <div className={classes.commissionWrapper}>
                    <Label>Address</Label>
                    <div>{machine.machineLocation}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={classnames(classes.row)}>
              <div className={classnames(classes.col, classes.col2)}>
                <div className={classes.innerRow}>
                  <div>
                    <Label>Paired at</Label>
                    <div>{moment(machine.pairedAt).format('YYYY-MM-DD HH:mm:ss')}</div>
                  </div>
                  <div className={classes.commissionWrapper}>
                    <Label>Software update</Label>
                    <div className={classes.innerRow}>
                      {machine.softwareVersion}
                      &nbsp;
                      <ActionButton
                        disabled
                        color='primary'
                        Icon={DownloadIcon}
                        InverseIcon={DownloadReversedIcon}
                      >
                        Update
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={classnames(classes.row)}>
              <div className={classnames(classes.col, classes.col2)}>
                <div className={classes.innerRow}>
                  <div>
                    <Label>Printer</Label>
                    <div>{machine.printer || 'unknown'}</div>
                  </div>
                  <div className={classes.commissionWrapper}>
                    <Label>Actions</Label>
                    <div className={classes.innerRow}>
                      <ActionButton
                        color='primary'
                        Icon={UnpairIcon}
                        InverseIcon={UnpairReversedIcon}
                        disabled={unpairDisabled}
                        onClick={unpair}
                      >
                        Unpair
                      </ActionButton>
                      &nbsp;
                      <ActionButton
                        color='primary'
                        Icon={RebootIcon}
                        InverseIcon={RebootReversedIcon}
                        disabled={rebootDisabled}
                        onClick={reboot}
                      >
                        Reboot
                      </ActionButton>
                      &nbsp;
                      <ActionButton
                        disabled
                        color='primary'
                        Icon={ShutdownIcon}
                        InverseIcon={ShutdownReversedIcon}
                        onClick={reboot}
                      >
                        Shutdown
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  )
}

export default MachineDetailsRow
