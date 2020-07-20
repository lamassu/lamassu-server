import { useMutation, useQuery } from '@apollo/react-hooks'
import { Dialog, DialogContent, SvgIcon, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Form, Formik, FastField } from 'formik'
import gql from 'graphql-tag'
import QRCode from 'qrcode.react'
import * as R from 'ramda'
import React, { memo, useEffect } from 'react'
import { useSetState, useCounter, useBoolean, useLifecycles } from 'react-use'
import * as Yup from 'yup'

import Title from 'src/components/Title'
import { Button } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import Sidebar from 'src/components/layout/Sidebar'
import { Info2, P, Info3 } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import { primaryColor } from 'src/styling/variables'

import styles from './styles'

const SAVE_CONFIG = gql`
  mutation createPairingTotem($name: String!) {
    createPairingTotem(name: $name)
  }
`
const GET_MACHINES = gql`
  {
    machines {
      name
      deviceId
    }
  }
`

const useStyles = makeStyles(styles)

const getSize = R.compose(R.length, R.pathOr([], ['machines']))

function usePairDevice({ name, count }) {
  const [on, toggle] = useBoolean(false)
  const { data, stopPolling, startPolling } = useQuery(GET_MACHINES)
  const size = getSize(data)

  useLifecycles(() => startPolling(10000), stopPolling)
  useEffect(() =>
    size > count && data?.machines?.some(m => m.name === name)
      ? toggle(true)
      : undefined
  )

  return [on]
}

const QrCodeComponent = ({ classes, payload, close, onPaired }) => {
  const { qrcode, count, name } = payload
  const [paired] = usePairDevice({ name, count })

  useEffect(() => {
    if (paired) {
      onPaired(name)
      setTimeout(() => close(), 3000)
    }
  }, [close, name, onPaired, paired])

  return (
    <>
      <Info2 className={classes.qrTitle}>
        Scan QR code with your new cryptomat
      </Info2>
      <div className={classes.qrCodeWrapper}>
        <div>
          <QRCode size={240} fgColor={primaryColor} value={qrcode} />
        </div>
        <div className={classes.qrTextWrapper}>
          <div className={classes.qrCodeWrapper}>
            <div className={classes.qrTextIcon}>
              <WarningIcon />
            </div>
            <P className={classes.qrText}>
              To pair the machine you need scan the QR code with your machine.
              To do this either snap a picture of this QR code or download it
              through the button above and scan it with the scanning bay on your
              machine.
            </P>
          </div>
          {paired && <Info3>✓ Machine has been successfully paired</Info3>}
        </div>
      </div>
    </>
  )
}

const initialValues = {
  name: ''
}

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required()
    .max(50, 'Too long')
})

const MachineNameComponent = ({ nextStep, classes, setPayload }) => {
  const [register] = useMutation(SAVE_CONFIG, {
    onCompleted: ({ createPairingTotem }) => {
      setPayload({ qrcode: createPairingTotem })
      nextStep()
    },
    onError: e => console.log(e)
  })

  return (
    <>
      <Info2 className={classes.nameTitle}>
        Machine Name (ex: Coffee shop 01)
      </Info2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={({ name }) => {
          setPayload({ name })
          register({ variables: { name } })
        }}>
        <Form className={classes.form}>
          <div>
            <FastField
              name="name"
              label="Enter machine name"
              component={TextInput}
            />
          </div>
          <div className={classes.button}>
            <Button type="submit">Submit</Button>
          </div>
        </Form>
      </Formik>
    </>
  )
}

const steps = [
  {
    label: 'Machine name',
    component: MachineNameComponent
  },
  {
    label: 'Scan QR code',
    component: QrCodeComponent
  }
]

const renderStepper = (step, it, idx, classes) => {
  const active = step === idx
  const past = idx < step
  const future = idx > step

  return (
    <div className={classes.item}>
      <span
        className={classnames({
          [classes.itemText]: true,
          [classes.itemTextActive]: active,
          [classes.itemTextPast]: past
        })}>
        {it.label}
      </span>
      {active && <CurrentStageIconZodiac />}
      {past && <CompleteStageIconZodiac />}
      {future && <EmptyStageIconZodiac />}
      {idx < steps.length - 1 && (
        <div
          className={classnames({
            [classes.stepperPath]: true,
            [classes.stepperPast]: past
          })}></div>
      )}
    </div>
  )
}

const AddMachine = memo(({ close, onPaired }) => {
  const classes = useStyles()
  const { data } = useQuery(GET_MACHINES)
  const [payload, setPayload] = useSetState({ qrcode: '', name: '', count: 0 })
  const [step, { inc }] = useCounter(0, steps.length, 0)
  const count = getSize(data)

  useEffect(() => setPayload({ count }), [count, setPayload])

  const Component = steps[step].component
  return (
    <div>
      <Dialog
        fullScreen
        className={classes.dialog}
        open={true}
        aria-labelledby="form-dialog-title">
        <DialogContent className={classes.dialog}>
          <div className={classes.wrapper}>
            <div className={classes.headerDiv}>
              <Title>Add Machine</Title>
              <IconButton disableRipple={true} onClick={close}>
                <SvgIcon color="error">
                  <CloseIcon />
                </SvgIcon>
              </IconButton>
            </div>
            <div className={classes.contentDiv}>
              <Sidebar>
                {steps.map((it, idx) => renderStepper(step, it, idx, classes))}
              </Sidebar>
              <div className={classes.contentWrapper}>
                <Component
                  classes={classes}
                  nextStep={() => inc(1)}
                  close={close}
                  onPaired={onPaired}
                  {...{ payload, setPayload }}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})

export default AddMachine
