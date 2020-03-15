import React, { memo, useState } from 'react'
import QRCode from 'qrcode.react'
import classnames from 'classnames'
import { Form, Formik, FastField } from 'formik'
import { makeStyles } from '@material-ui/core/styles'
import * as Yup from 'yup'
import { gql } from 'apollo-boost'
import { useMutation } from '@apollo/react-hooks'
import { Dialog, DialogContent, SvgIcon, IconButton } from '@material-ui/core'

import { ReactComponent as CompleteStageIconZodiac } from 'src/styling/icons/stage/zodiac/complete.svg'
import { ReactComponent as CurrentStageIconZodiac } from 'src/styling/icons/stage/zodiac/current.svg'
import { ReactComponent as EmptyStageIconZodiac } from 'src/styling/icons/stage/zodiac/empty.svg'
import { primaryColor } from 'src/styling/variables'
import Title from 'src/components/Title'
import Sidebar from 'src/components/Sidebar'
import { Info2, P } from 'src/components/typography'
import { TextInput } from 'src/components/inputs/formik'
import { Button } from 'src/components/buttons'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'

import styles from './styles'

const SAVE_CONFIG = gql`
  mutation createPairingTotem($name: String!) {
    createPairingTotem(name: $name)
  }
`

const useStyles = makeStyles(styles)

const QrCodeComponent = ({ classes, qrCode, close }) => {
  const [doneButton, setDoneButton] = useState(null)
  setTimeout(() => setDoneButton(true), 2000)

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
          <div className={classes.qrTextIcon}>
            <WarningIcon />
          </div>
          <P className={classes.qrText}>
            To pair the machine you need scan the QR code with your machine. To
            do this either snap a picture of this QR code or download it through
            the button above and scan it with the scanning bay on your machine.
          </P>
        </div>
      </div>
      {doneButton && (
        <div className={classes.button}>
          <Button type="submit" onClick={close}>
            Done
          </Button>
        </div>
      )}
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

const MachineNameComponent = ({ nextStep, classes, setQrCode }) => {
  const [register] = useMutation(SAVE_CONFIG, {
    onCompleted: data => {
      if (process.env.NODE_ENV === 'development') {
        console.log('totem: ', data.createPairingTotem)
      }
      setQrCode(data.createPairingTotem)
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

const AddMachine = memo(({ close }) => {
  const classes = useStyles()
  const [qrCode, setQrCode] = useState(null)
  const [step, setStep] = useState(0)

  const Component = steps[step].component
  return (
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
                qrCode={qrCode}
                close={close}
                setQrCode={setQrCode}
                nextStep={() => setStep(step + 1)}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

export default AddMachine
