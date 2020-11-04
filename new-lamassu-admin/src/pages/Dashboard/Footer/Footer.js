import { makeStyles } from '@material-ui/core'
import React from 'react'

import { white } from 'src/styling/variables'

const useStyles = makeStyles({
  footer: {
    position: 'fixed',
    left: 0,
    bottom: 0,
    width: '100vw',
    backgroundColor: white,
    textAlign: 'left'
  },
  content: {
    width: 1200,
    margin: '0 auto'
  }
})
const Footer = () => {
  const classes = useStyles()

  return (
    <>
      <div className={classes.footer}>
        <div className={classes.content}>
          <h1>Footer content</h1>
        </div>
      </div>
    </>
  )
}

export default Footer
