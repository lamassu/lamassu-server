import { makeStyles, Drawer, Grid } from '@material-ui/core'
import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import classnames from 'classnames'
import * as R from 'ramda'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'

import Modal from 'src/components/Modal'
import Stepper from 'src/components/Stepper'
import { Button, Link } from 'src/components/buttons'
import { P, H2, Info2 } from 'src/components/typography'
import { spacer } from 'src/styling/variables'

const getStepperProps = (current, steps) => ({
  steps: R.length(steps),
  currentStep: R.compose(
    R.add(1),
    R.findIndex(R.propEq('namespace', current))
  )(steps)
})

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

function Footer({ next, current, steps: collection, path, tag, p }) {
  const classes = useStyles()
  const history = useHistory()
  const [open, setOpen] = useState(true)
  const [fullExample, setFullExample] = useState(false)

  const handleClick = () => history.push(`${path}/${next}`)
  const handleClickAway = () => setOpen(false)
  const { currentStep, steps } = getStepperProps(current, collection)

  const wrapperClassNames = {
    [classes.wrapper]: true,
    [classes.smallWrapper]: !open
  }

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Drawer
        onClick={() => setOpen(true)}
        anchor={'bottom'}
        open={true}
        variant={'persistent'}
        classes={{ paperAnchorDockedBottom: classes.drawer }}>
        <div className={classnames(wrapperClassNames)}>
          <Grid
            container
            direction="row"
            justify="center"
            alignItems="baseline">
            <Grid
              item
              xs={5}
              container
              direction={open ? 'column' : 'row'}
              justify="flex-start"
              alignItems="baseline">
              <H2 className={classes.title}>Setup Lamassu Admin</H2>
              <Info2 className={classes.subtitle}>{tag}</Info2>
              {open && <P>{p}</P>}
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
                  <Stepper {...{ currentStep, steps }}></Stepper>
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
                  <Button size="lg" disabled={!next} onClick={handleClick}>
                    Continue
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
          <img
            width={1152}
            src={`/fullexample.${current}.png`}
            alt={`${current} configuration example`}
          />
        </Modal>
      </Drawer>
    </ClickAwayListener>
  )
}

export default Footer
