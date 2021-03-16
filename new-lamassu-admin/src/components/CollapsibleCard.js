import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'

import { white } from 'src/styling/variables'

const cardState = Object.freeze({
  DEFAULT: 'default',
  SHRUNK: 'shrunk',
  EXPANDED: 'expanded'
})

const styles = {
  card: {
    wordWrap: 'break-word',
    boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.08)',
    borderRadius: 12,
    padding: 24,
    backgroundColor: white
  }
}

const useStyles = makeStyles(styles)

const CollapsibleCard = ({ className, state, shrunkComponent, children }) => {
  const classes = useStyles()
  return (
    <Grid item className={classnames(className, classes.card)}>
      {state === cardState.SHRUNK ? shrunkComponent : children}
    </Grid>
  )
}

CollapsibleCard.propTypes = {
  shrunkComponent: PropTypes.node.isRequired
}

export default CollapsibleCard
export { cardState }
