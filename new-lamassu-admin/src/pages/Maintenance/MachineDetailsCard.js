import { Grid /*, Divider */ } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import BigNumber from 'bignumber.js'
import moment from 'moment'
import React from 'react'

import MachineActions from 'src/components/machineActions/MachineActions'

// import { Status } from 'src/components/Status'
// import { ReactComponent as LinkIcon } from 'src/styling/icons/button/link/zodiac.svg'

import { labelStyles, machineDetailsStyles } from './MachineDetailsCard.styles'

// const supportArtices = [
//   {
//     // Default article for non-maped statuses
//     code: undefined,
//     label: 'Troubleshooting',
//     article:
//       'https://support.lamassu.is/hc/en-us/categories/115000075249-Troubleshooting'
//   }
//   // TODO add Stuck and Fully Functional statuses articles for the new-admins
// ]

// const article = ({ code: status }) =>
//   supportArtices.find(({ code: article }) => article === status)

const useLStyles = makeStyles(labelStyles)

const Label = ({ children }) => {
  const classes = useLStyles()

  return <div className={classes.label}>{children}</div>
}

const useMDStyles = makeStyles(machineDetailsStyles)

const Container = ({ children, ...props }) => (
  <Grid container spacing={4} {...props}>
    {children}
  </Grid>
)

const Item = ({ children, ...props }) => (
  <Grid item xs {...props}>
    {children}
  </Grid>
)

const MachineDetailsRow = ({ it: machine, onActionSuccess }) => {
  const classes = useMDStyles()

  return (
    <Container className={classes.wrapper}>
      {/* <Item xs={5}>
        <Container>
          <Item>
            <Label>Statuses</Label>
            <ul className={classes.list}>
              {machine.statuses.map((status, index) => (
                <li className={classes.item} key={index}>
                  <Status status={status} />
                </li>
              ))}
            </ul>
          </Item>
          <Item>
            <Label>Lamassu Support article</Label>
            <ul className={classes.list}>
              {machine.statuses
                .map(article)
                .map(({ label, article }, index) => (
                  <li className={classes.item} key={index}>
                    <a
                      className={classes.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      href={article}>
                      '{label}' <LinkIcon />
                    </a>
                  </li>
                ))}
            </ul>
          </Item>
        </Container>
      </Item>
      <Divider
        orientation="vertical"
        flexItem
        className={classes.separator}
      /> */}
      <Item xs>
        <Container className={classes.row}>
          <Item xs={2}>
            <Label>Machine Model</Label>
            <span>{machine.model}</span>
          </Item>
          <Item xs={4}>
            <Label>Paired at</Label>
            <span>
              {moment(machine.pairedAt).format('YYYY-MM-DD HH:mm:ss')}
            </span>
          </Item>
          <Item xs={6}>
            <MachineActions
              machine={machine}
              onActionSuccess={onActionSuccess}></MachineActions>
          </Item>
          <Item xs={2}>
            <Label>Network speed</Label>
            <span>
              {machine.downloadSpeed
                ? new BigNumber(machine.downloadSpeed).toFixed(4).toString() +
                  '  MB/s'
                : 'unavailable'}
            </span>
          </Item>
          <Item xs={2}>
            <Label>Latency</Label>
            <span>
              {machine.responseTime
                ? new BigNumber(machine.responseTime).toFixed(3).toString() +
                  '  ms'
                : 'unavailable'}
            </span>
          </Item>
          <Item xs={2}>
            <Label>Packet Loss</Label>
            <span>
              {machine.packetLoss
                ? new BigNumber(machine.packetLoss).toFixed(3).toString() +
                  '  %'
                : 'unavailable'}
            </span>
          </Item>
        </Container>
      </Item>
    </Container>
  )
}

export default MachineDetailsRow
