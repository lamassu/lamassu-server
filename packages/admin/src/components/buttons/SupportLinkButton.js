import { makeStyles } from '@material-ui/core'
import React from 'react'

import { ActionButton } from 'src/components/buttons'
import { ReactComponent as InverseLinkIcon } from 'src/styling/icons/action/external link/white.svg'
import { ReactComponent as LinkIcon } from 'src/styling/icons/action/external link/zodiac.svg'
import { spacer, primaryColor } from 'src/styling/variables'

const useStyles = makeStyles({
  actionButton: {
    marginBottom: spacer * 4
  },
  actionButtonLink: {
    textDecoration: 'none',
    color: primaryColor
  }
})

const SupportLinkButton = ({ link, label }) => {
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
        InverseIcon={InverseLinkIcon}>
        {label}
      </ActionButton>
    </a>
  )
}

export default SupportLinkButton
