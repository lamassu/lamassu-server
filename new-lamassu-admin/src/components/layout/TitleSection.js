import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Title from 'src/components/Title'
import { SubpageButton } from 'src/components/buttons'
import { Info1, Label1 } from 'src/components/typography'

import styles from './TitleSection.styles'

const useStyles = makeStyles(styles)

const TitleSection = ({
  className,
  title,
  error,
  labels,
  buttons = [],
  children
}) => {
  const classes = useStyles()
  return (
    <div className={classnames(classes.titleWrapper, className)}>
      <div className={classes.titleAndButtonsContainer}>
        <Title>{title}</Title>
        {error && (
          <ErrorMessage className={classes.error}>Failed to save</ErrorMessage>
        )}
        {buttons.length > 0 && (
          <>
            {buttons.map((button, idx) => (
              <SubpageButton
                key={idx}
                className={classes.subpageButton}
                Icon={button.icon}
                InverseIcon={button.inverseIcon}
                toggle={button.toggle}
                forceDisable={button.forceDisable}>
                <Info1 className={classes.buttonText}>{button.text}</Info1>
              </SubpageButton>
            ))}
          </>
        )}
      </div>
      <Box display="flex" flexDirection="row">
        {(labels ?? []).map(({ icon, label }, idx) => (
          <Box key={idx} display="flex" alignItems="center">
            <div className={classes.icon}>{icon}</div>
            <Label1 className={classes.label}>{label}</Label1>
          </Box>
        ))}
      </Box>
      {children}
    </div>
  )
}

export default TitleSection
