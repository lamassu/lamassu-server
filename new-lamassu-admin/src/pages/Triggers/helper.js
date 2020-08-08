import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import { Field, useFormikContext } from 'formik'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import { TextInput, RadioGroup } from 'src/components/inputs/formik'
import Autocomplete from 'src/components/inputs/formik/Autocomplete'
import { H4 } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { errorColor } from 'src/styling/variables'

const useStyles = makeStyles({
  radioLabel: {
    height: 40,
    padding: [[0, 10]]
  },
  radio: {
    padding: 4,
    margin: 4
  },
  radioGroup: {
    flexDirection: 'row'
  },
  error: {
    color: errorColor
  },
  specialLabel: {
    height: 40,
    padding: 0
  },
  specialGrid: {
    display: 'grid',
    gridTemplateColumns: [[182, 162, 141]]
  },
  directionIcon: {
    marginRight: 2
  },
  directionName: {
    marginLeft: 6
  }
})

const cashDirection = Yup.string().required('Required')
const triggerType = Yup.string().required('Required')
const threshold = Yup.number().required('Required')
const requirement = Yup.string().required('Required')

const Schema = Yup.object().shape({
  triggerType,
  requirement,
  threshold,
  cashDirection
})

// Direction
const directionSchema = Yup.object().shape({ cashDirection })

const directionOptions = [
  { display: 'Both', code: 'both' },
  { display: 'Only cash-in', code: 'cashIn' },
  { display: 'Only cash-out', code: 'cashOut' }
]

const Direction = () => {
  const classes = useStyles()
  const { errors } = useFormikContext()

  const titleClass = {
    [classes.error]: errors.cashDirection
  }

  return (
    <>
      <Box display="flex" alignItems="center">
        <H4 className={classnames(titleClass)}>
          In which type of transactions will it trigger?
        </H4>
      </Box>
      <Field
        component={RadioGroup}
        name="cashDirection"
        options={directionOptions}
        labelClassName={classes.radioLabel}
        radioClassName={classes.radio}
        className={classes.radioGroup}
      />
    </>
  )
}

const direction = {
  schema: directionSchema,
  options: directionOptions,
  Component: Direction,
  initialValues: { cashDirection: '' }
}

// TYPE
const typeSchema = Yup.object().shape({
  triggerType,
  threshold
})

const typeOptions = [
  { display: 'Transaction amount', code: 'txAmount' },
  { display: 'Transaction volume', code: 'txVolume' },
  { display: 'Transaction velocity', code: 'txVelocity' },
  { display: 'Consecutive days', code: 'consecutiveDays' }
]

const Type = () => {
  const classes = useStyles()
  const { errors, touched } = useFormikContext()

  const typeClass = {
    [classes.error]: errors.triggerType && touched.triggerType
  }

  return (
    <>
      <Box display="flex" alignItems="center">
        <H4 className={classnames(typeClass)}>Choose trigger type</H4>
      </Box>
      <Field
        component={RadioGroup}
        name="triggerType"
        options={typeOptions}
        labelClassName={classes.radioLabel}
        radioClassName={classes.radio}
        className={classes.radioGroup}
      />

      <Field
        component={TextInput}
        label="Threshold"
        size="lg"
        name="threshold"
        options={typeOptions}
      />
    </>
  )
}

const type = {
  schema: typeSchema,
  options: typeOptions,
  Component: Type,
  initialValues: { triggerType: '', threshold: '' }
}

const requirementSchema = Yup.object().shape({
  requirement
})

const requirementOptions = [
  { display: 'SMS verification', code: 'sms' },
  { display: 'ID card image', code: 'idPhoto' },
  { display: 'ID data', code: 'idData' },
  { display: 'Customer camera', code: 'facephoto' },
  { display: 'Sanctions', code: 'sanctions' },
  { display: 'Super user', code: 'superuser' },
  { display: 'Suspend', code: 'suspend' },
  { display: 'Block', code: 'block' }
]

const Requirement = () => {
  const classes = useStyles()
  const { errors } = useFormikContext()

  const titleClass = {
    [classes.error]: errors.requirement
  }

  return (
    <>
      <Box display="flex" alignItems="center">
        <H4 className={classnames(titleClass)}>Choose a requirement</H4>
      </Box>
      <Field
        component={RadioGroup}
        name="requirement"
        options={requirementOptions}
        labelClassName={classes.specialLabel}
        radioClassName={classes.radio}
        className={classnames(classes.radioGroup, classes.specialGrid)}
      />
    </>
  )
}

const requirements = {
  schema: requirementSchema,
  options: requirementOptions,
  Component: Requirement,
  initialValues: { requirement: '' }
}

const getView = (data, code, compare) => it => {
  if (!data) return ''

  return R.compose(R.prop(code), R.find(R.propEq(compare ?? 'code', it)))(data)
}

const DirectionDisplay = ({ code }) => {
  const classes = useStyles()
  const displayName = getView(directionOptions, 'display')(code)
  const showCashIn = code === 'cashIn' || code === 'both'
  const showCashOut = code === 'cashOut' || code === 'both'

  return (
    <div>
      {showCashOut && <TxOutIcon className={classes.directionIcon} />}
      {showCashIn && <TxInIcon className={classes.directionIcon} />}
      <span className={classes.directionName}>{displayName}</span>
    </div>
  )
}

const elements = [
  {
    name: 'triggerType',
    size: 'sm',
    width: 230,
    input: ({ field: { value: name } }) => (
      <>{getView(typeOptions, 'display')(name)}</>
    ),
    view: getView(typeOptions, 'display'),
    inputProps: {
      options: typeOptions,
      valueProp: 'code',
      getLabel: R.path(['display']),
      limit: null
    }
  },
  {
    name: 'requirement',
    size: 'sm',
    width: 230,
    input: ({ field: { value: name } }) => (
      <>{getView(requirementOptions, 'display')(name)}</>
    ),
    view: getView(requirementOptions, 'display'),
    inputProps: {
      options: requirementOptions,
      valueProp: 'code',
      getLabel: R.path(['display']),
      limit: null
    }
  },
  {
    name: 'threshold',
    size: 'sm',
    width: 260,
    textAlign: 'right',
    input: TextInput
  },
  {
    name: 'cashDirection',
    size: 'sm',
    width: 282,
    view: it => <DirectionDisplay code={it} />,
    input: Autocomplete,
    inputProps: {
      options: directionOptions,
      valueProp: 'code',
      getLabel: R.path(['display']),
      limit: null
    }
  }
]

const triggerOrder = R.map(R.prop('code'))(typeOptions)
const sortBy = [
  R.comparator(
    (a, b) =>
      triggerOrder.indexOf(a.triggerType) < triggerOrder.indexOf(b.triggerType)
  )
]

export { Schema, elements, direction, type, requirements, sortBy }
