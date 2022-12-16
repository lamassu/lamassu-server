import { makeStyles } from '@material-ui/core'
import React from 'react'

import { ActionButton } from 'src/components/buttons'
import { ReactComponent as InverseLinkIcon } from 'src/styling/icons/action/external link/white.svg'
import { ReactComponent as LinkIcon } from 'src/styling/icons/action/external link/zodiac.svg'
import { spacer, primaryColor } from 'src/styling/variables'

const SupportLinkButton = ({ link, label, bottomSpace = 4 }) => {
  const useStyles = makeStyles({
    actionButton: {
      marginBottom: spacer * bottomSpace
    },
    actionButtonLink: {
      textDecoration: 'none',
      color: primaryColor
    }
  })

  const classes = useStyles()
  return (
    <a
      className={classes.actionButtonLink}
      target="_blank"
      rel="noopener noreferrer"
      href={link}>
      <ActionButton
        className={classes.actionButton}
        color="primary"
        Icon={LinkIcon}
        InverseIcon={InverseLinkIcon}
        type="button">
        {label}
      </ActionButton>
    </a>
  )
}

export default SupportLinkButton
