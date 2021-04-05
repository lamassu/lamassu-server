import { useQuery } from '@apollo/react-hooks'
import Checkbox from '@material-ui/core/Checkbox'
import { makeStyles } from '@material-ui/core/styles'
import CheckBoxIcon from '@material-ui/icons/CheckBox'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import { Label2, Info3 } from 'src/components/typography'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import {
  fontSize2,
  fontSize3,
  secondaryColor,
  offColor
} from 'src/styling/variables'

const useStyles = makeStyles({
  root: {
    color: secondaryColor,
    '&$checked': {
      color: secondaryColor
    }
  },
  checked: {},
  checkBoxLabel: {
    display: 'flex'
  },
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    '& > svg': {
      marginRight: 10
    }
  },
  message: {
    display: 'flex',
    alignItems: 'center',
    color: offColor,
    margin: 0,
    whiteSpace: 'break-spaces'
  }
})

const GET_INFO = gql`
  query getData {
    config
  }
`

const CheckboxInput = ({ name, onChange, value, ...props }) => {
  const { data: configData } = useQuery(GET_INFO)

  const disabledMessage = 'RBF verification not available'
  const label = 'Enable RBF verification'
  const wallet = R.lensPath(['config', 'wallets_BTC_wallet'])
  const isEnabled = R.equals(R.view(wallet, configData), 'bitcoind')
  const classes = useStyles()

  return (
    <>
      {isEnabled ? (
        <div className={classes.checkBoxLabel}>
          <Label2>{label}</Label2>
          <Checkbox
            id={name}
            classes={{
              root: classes.root,
              checked: classes.checked
            }}
            onChange={onChange}
            value={value}
            checked={value}
            icon={
              <CheckBoxOutlineBlankIcon
                style={{ marginLeft: 2, fontSize: fontSize3 }}
              />
            }
            checkedIcon={<CheckBoxIcon style={{ fontSize: fontSize2 }} />}
            disableRipple
            {...props}
          />
        </div>
      ) : (
        <div className={classes.wrapper}>
          <WarningIcon />
          <Info3 className={classes.message}>{disabledMessage}</Info3>
        </div>
      )}
    </>
  )
}

export default CheckboxInput
