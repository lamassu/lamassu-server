import { CardContent, Card, Grid } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import { Form, Formik, Field as FormikField } from 'formik'
import { useState, React } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import PromptWhenDirty from 'src/components/PromptWhenDirty'
import { MainStatus } from 'src/components/Status'
import { Tooltip } from 'src/components/Tooltip'
import { ActionButton } from 'src/components/buttons'
import { Label1, Info3, H3 } from 'src/components/typography'
import {
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED,
  OVERRIDE_PENDING
} from 'src/pages/Customers/components/propertyCard'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as EditReversedIcon } from 'src/styling/icons/action/edit/white.svg'
import { ReactComponent as AuthorizeReversedIcon } from 'src/styling/icons/button/authorize/white.svg'
import { ReactComponent as AuthorizeIcon } from 'src/styling/icons/button/authorize/zodiac.svg'
import { ReactComponent as CancelReversedIcon } from 'src/styling/icons/button/cancel/white.svg'
import { ReactComponent as CancelIcon } from 'src/styling/icons/button/cancel/zodiac.svg'
import { ReactComponent as SaveReversedIcon } from 'src/styling/icons/circle buttons/save/white.svg'
import { ReactComponent as SaveIcon } from 'src/styling/icons/circle buttons/save/zodiac.svg'
import { comet } from 'src/styling/variables'

import styles from './EditableCard.styles.js'

const useStyles = makeStyles(styles)

const fieldStyles = {
  field: {
    position: 'relative',
    width: 280,
    height: 48,
    padding: [[0, 4, 4, 0]]
  },
  label: {
    color: comet,
    margin: [[0, 3]]
  },
  notEditing: {
    display: 'flex',
    flexDirection: 'column',
    '& > p:first-child': {
      height: 16,
      lineHeight: '16px',
      transformOrigin: 'left',
      paddingLeft: 0,
      margin: [[3, 0, 3, 0]]
    },
    '& > p:last-child': {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      margin: 0
    }
  },
  editing: {
    '& > input': {
      padding: 0
    }
  }
}

const fieldUseStyles = makeStyles(fieldStyles)

const EditableField = ({ editing, field, size, ...props }) => {
  const classes = fieldUseStyles()

  const classNames = {
    [classes.field]: true,
    [classes.notEditing]: !editing
  }

  return (
    <div className={classnames(classNames)}>
      {!editing && (
        <>
          <Label1 className={classes.label}>{field.label}</Label1>
          <Info3>{field.value}</Info3>
        </>
      )}
      {editing && (
        <>
          <Label1 className={classes.label}>{field.label}</Label1>
          <FormikField
            className={classes.editing}
            id={field.name}
            name={field.name}
            component={field.component}
            placeholder={field.placeholder}
            value={field.value}
            type={field.type}
            width={size}
            {...props}
          />
        </>
      )}
    </div>
  )
}

const EditableCard = ({
  data,
  save,
  authorize,
  reject,
  state,
  title,
  titleIcon,
  children
}) => {
  const classes = useStyles()

  const [editing, setEditing] = useState(false)
  const [error, setError] = useState(null)

  const label1ClassNames = {
    [classes.label1]: true,
    [classes.label1Pending]: state === OVERRIDE_PENDING,
    [classes.label1Rejected]: state === OVERRIDE_REJECTED,
    [classes.label1Accepted]: state === OVERRIDE_AUTHORIZED
  }

  const authorized =
    state === OVERRIDE_PENDING
      ? { label: 'Pending', type: 'neutral' }
      : state === OVERRIDE_REJECTED
      ? { label: 'Rejected', type: 'error' }
      : { label: 'Accepted', type: 'success' }

  const editableField = field => {
    return <EditableField field={field} editing={editing} size={180} />
  }

  return (
    <div>
      <Card className={classes.card}>
        <CardContent>
          <div className={classes.cardHeader}>
            {titleIcon}
            <H3 className={classes.cardTitle}>{title}</H3>
            <Tooltip width={304}></Tooltip>
            <div className={classnames(label1ClassNames)}>
              <MainStatus statuses={[authorized]} />
            </div>
          </div>
          <Formik
            validateOnBlur={false}
            validateOnChange={false}
            enableReinitialize
            onSubmit={values => save(values)}
            onReset={() => {
              setEditing(false)
              setError(false)
            }}>
            <Form>
              <PromptWhenDirty />
              <div className={classes.row}>
                <Grid container>
                  <Grid container direction="column" item xs={6}>
                    {data?.map((field, idx) => {
                      return idx >= 0 && idx < 4 ? editableField(field) : null
                    })}
                  </Grid>
                  <Grid container direction="column" item xs={6}>
                    {data?.map((field, idx) => {
                      return idx >= 4 ? editableField(field) : null
                    })}
                  </Grid>
                </Grid>
              </div>
              {children}
              <div className={classes.edit}>
                {!editing && (
                  <div className={classes.editButton}>
                    <ActionButton
                      color="primary"
                      Icon={EditIcon}
                      InverseIcon={EditReversedIcon}
                      onClick={() => setEditing(true)}>
                      {`Edit`}
                    </ActionButton>
                  </div>
                )}
                {editing && (
                  <div className={classes.editingButtons}>
                    {data && (
                      <div className={classes.button}>
                        <ActionButton
                          color="secondary"
                          Icon={SaveIcon}
                          InverseIcon={SaveReversedIcon}
                          type="submit">
                          Save
                        </ActionButton>
                      </div>
                    )}
                    <div className={classes.button}>
                      <ActionButton
                        color="secondary"
                        Icon={CancelIcon}
                        InverseIcon={CancelReversedIcon}
                        type="reset">
                        Cancel
                      </ActionButton>
                    </div>
                    {authorized.label !== 'Accepted' && (
                      <div className={classes.button}>
                        <ActionButton
                          color="secondary"
                          Icon={AuthorizeIcon}
                          InverseIcon={AuthorizeReversedIcon}
                          type="submit"
                          onClick={() => authorize()}>
                          {'Authorize'}
                        </ActionButton>
                      </div>
                    )}
                    {authorized.label !== 'Rejected' && (
                      <ActionButton
                        color="secondary"
                        Icon={CancelIcon}
                        InverseIcon={CancelReversedIcon}
                        type="submit"
                        onClick={() => reject()}>
                        {'Reject'}
                      </ActionButton>
                    )}
                    {error && (
                      <ErrorMessage>Failed to save changes</ErrorMessage>
                    )}
                  </div>
                )}
              </div>
            </Form>
          </Formik>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditableCard
