import { makeStyles, Drawer, Grid } from '@material-ui/core'
import classnames from 'classnames'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import Stepper from 'src/components/Stepper'
import { Button, Link } from 'src/components/buttons'
import { P, H2, Info2 } from 'src/components/typography'
import { spacer } from 'src/styling/variables'

const useStyles = makeStyles(() => ({
  drawer: {
    borderTop: 'none',
    boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.08)'
  },
  wrapper: {
    padding: '32px 0',
    flexGrow: 1,
    height: 264
  },
  smallWrapper: {
    height: 84
  },
  title: {
    margin: [[0, spacer * 4, 0, 0]]
  },
  subtitle: {
    marginTop: spacer,
    marginBottom: 6,
    lineHeight: 1.25,
    display: 'inline'
  },
  modal: {
    background: 'none',
    boxShadow: 'none'
  }
}))

function Footer({ currentStep, steps, subtitle, text, exImage, open, start }) {
  const classes = useStyles()
  const [fullExample, setFullExample] = useState(false)

  const wrapperClassNames = {
    [classes.wrapper]: true,
    [classes.smallWrapper]: !open
  }

  return (
    <Drawer
      anchor={'bottom'}
      open={true}
      variant={'persistent'}
      classes={{ paperAnchorDockedBottom: classes.drawer }}>
      <div className={classnames(wrapperClassNames)}>
        <Grid container direction="row" justify="center" alignItems="baseline">
          <Grid
            item
            xs={5}
            container
            direction={open ? 'column' : 'row'}
            justify="flex-start"
            alignItems="baseline">
            <H2 className={classes.title}>Setup Lamassu Admin</H2>
            <Info2 className={classes.subtitle}>{subtitle}</Info2>
            {open && <P>{text}</P>}
          </Grid>
          <Grid
            item
            xs={4}
            container
            direction="column"
            justify="flex-start"
            alignItems="flex-end"
            spacing={5}>
            <Grid item xs={12}>
              {steps && currentStep && (
                <Stepper currentStep={currentStep} steps={steps} />
              )}
            </Grid>
          </Grid>
        </Grid>
        {open && (
          <Grid
            container
            direction="row"
            justify="center"
            alignItems="baseline">
            <Grid
              item
              xs={5}
              container
              direction="column"
              justify="flex-start"
              alignItems="flex-start">
              <Link
                onClick={() => {
                  setFullExample(true)
                }}>
                See full example
              </Link>
            </Grid>
            <Grid
              item
              xs={4}
              container
              direction="column"
              justify="flex-start"
              alignItems="flex-end"
              spacing={5}>
              <Grid item>
                <Button size="lg" onClick={start}>
                  Get Started
                </Button>
              </Grid>
            </Grid>
          </Grid>
        )}
      </div>
      <Modal
        closeOnEscape={true}
        closeOnBackdropClick={true}
        className={classes.modal}
        xl={true}
        width={1152 + 120 + 56}
        handleClose={() => {
          setFullExample(false)
        }}
        open={fullExample}>
        <img width={1152} src={exImage} alt="" />
      </Modal>
    </Drawer>
  )
}

export default Footer
