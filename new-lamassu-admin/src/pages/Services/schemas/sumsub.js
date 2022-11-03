import React, { useState } from 'react'
import * as Yup from 'yup'

import { Button } from 'src/components/buttons'
import { Checkbox } from 'src/components/inputs'
import { SecretInput, TextInput } from 'src/components/inputs/formik'
import { P } from 'src/components/typography'

import { secretTest } from './helper'

const SumsubSplash = ({ classes, onContinue }) => {
  const [canContinue, setCanContinue] = useState(false)

  return (
    <div className={classes.form}>
      <P>
        Before linking the Sumsub 3rd party service to the Lamassu Admin, make
        sure you have configured the required parameters in your personal Sumsub
        Dashboard.
      </P>
      <P>
        These parameters include the Sumsub Global Settings, Applicant Levels,
        Twilio and Webhooks.
      </P>
      <Checkbox
        value={canContinue}
        onChange={() => setCanContinue(!canContinue)}
        settings={{
          enabled: true,
          label: 'I have completed the steps needed to configure Sumsub',
          rightSideLabel: true
        }}
      />
      <div className={classes.footer}>
        <div className={classes.buttonWrapper}>
          <Button disabled={!canContinue} onClick={onContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}

const schema = {
  code: 'sumsub',
  name: 'Sumsub',
  category: 'Compliance',
  allowMultiInstances: false,
  SplashScreenComponent: SumsubSplash,
  elements: [
    {
      code: 'apiToken',
      display: 'API Token',
      component: SecretInput
    },
    {
      code: 'secretKey',
      display: 'Secret Key',
      component: SecretInput
    },
    {
      code: 'applicantLevel',
      display: 'Applicant Level',
      component: TextInput,
      face: true
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      apiToken: Yup.string('The API token must be a string')
        .max(100, 'The API token is too long')
        .test(secretTest(account?.apiToken, 'API token')),
      secretKey: Yup.string('The secret key must be a string')
        .max(100, 'The secret key is too long')
        .test(secretTest(account?.secretKey, 'secret key')),
      applicantLevel: Yup.string('The applicant level must be a string')
        .max(100, 'The applicant level is too long')
        .required('The applicant level is required')
    })
  }
}

export default schema
