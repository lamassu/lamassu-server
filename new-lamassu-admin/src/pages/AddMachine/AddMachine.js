import { useMutation, useQuery } from '@apollo/react-hooks'
import { Dialog, DialogContent, SvgIcon, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import { Form, Formik, FastField } from 'formik'
import gql from 'graphql-tag'
import QRCode from 'qrcode.react'
import * as R from 'ramda'
import React, { memo, useState, useEffect, useRef } from 'react'
import * as Yup from 'yup'

import Title from 'src/components/Title'
import { Button } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import Sidebar from 'src/components/layout/Sidebar'
import { Info2, P } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { ReactComponent as CompleteStageIconSpring } from 'src/styling/icons/stage/spring/complete.svg'
import { ReactComponent as CompleteStageIconZodiac } from 'src/styling/icons/stage/zodiac/complete.svg'
import { ReactComponent as CurrentStageIconZodiac } from 'src/styling/icons/stage/zodiac/current.svg'
import { ReactComponent as EmptyStageIconZodiac } from 'src/styling/icons/stage/zodiac/empty.svg'
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

const QrCodeComponent = ({ classes, qrCode, name, count, onPaired }) => {
  const timeout = useRef(null)
  const CLOSE_SCREEN_TIMEOUT = 2000
  const { data } = useQuery(GET_MACHINES, { pollInterval: 10000 })

  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }
    }
  }, [])

  const addedMachine = data?.machines?.find(m => m.name === name)
  const hasNewMachine = getSize(data) > count && addedMachine
  if (hasNewMachine) {
    timeout.current = setTimeout(
      () => onPaired(addedMachine),
      CLOSE_SCREEN_TIMEOUT
    )
  }

  return (
    <>
      <Info2 className={classes.qrTitle}>
        Scan QR code with your new cryptomat
      </Info2>
      <div className={classes.qrCodeWrapper}>
        <div>
          <QRCode size={240} fgColor={primaryColor} value={qrCode} />
        </div>
        <div className={classes.qrTextWrapper}>
          <div className={classes.qrTextInfoWrapper}>
            <div className={classes.qrTextIcon}>
              <WarningIcon />
            </div>
            <div className={classes.textWrapper}>
              <P className={classes.qrText}>
                To pair the machine you need scan the QR code with your machine.
                To do this either snap a picture of this QR code or download it
                through the button above and scan it with the scanning bay on
                your machine.
              </P>
            </div>
          </div>
          {hasNewMachine && (
            <div className={classes.successMessageWrapper}>
              <div className={classes.successMessageIcon}>
                <CompleteStageIconSpring />
              </div>
              <Info2 className={classes.successMessage}>
                Machine has been successfully paired!
              </Info2>
            </div>
          )}
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
    .max(50)
})

const MachineNameComponent = ({ nextStep, classes, setQrCode, setName }) => {
  const [register] = useMutation(SAVE_CONFIG, {
    onCompleted: ({ createPairingTotem }) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`totem: "${createPairingTotem}" `)
      }
      setQrCode(createPairingTotem)
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
        validateOnBlur={false}
        validateOnChange={false}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={({ name }) => {
          setName(name)
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
  const [qrCode, setQrCode] = useState('')
  const [name, setName] = useState('')
  const [step, setStep] = useState(0)
  const count = getSize(data)

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
                  nextStep={() => setStep(1)}
                  count={count}
                  onPaired={onPaired}
                  qrCode={qrCode}
                  setQrCode={setQrCode}
                  name={name}
                  setName={setName}
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
