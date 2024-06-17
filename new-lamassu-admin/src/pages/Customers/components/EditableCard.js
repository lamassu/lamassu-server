import { CardContent, Card, Grid } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import { Form, Formik, Field as FormikField } from 'formik'
import * as R from 'ramda'
import { useState, React } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import PromptWhenDirty from 'src/components/PromptWhenDirty'
import { MainStatus } from 'src/components/Status'
import { ActionButton } from 'src/components/buttons'
import { Label1, P, H3 } from 'src/components/typography'
import {
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED,
  OVERRIDE_PENDING
} from 'src/pages/Customers/components/propertyCard'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { ReactComponent as DeleteReversedIcon } from 'src/styling/icons/action/delete/white.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as EditReversedIcon } from 'src/styling/icons/action/edit/white.svg'
import { ReactComponent as AuthorizeIcon } from 'src/styling/icons/button/authorize/white.svg'
import { ReactComponent as BlockIcon } from 'src/styling/icons/button/block/white.svg'
import { ReactComponent as CancelReversedIcon } from 'src/styling/icons/button/cancel/white.svg'
import { ReactComponent as DataReversedIcon } from 'src/styling/icons/button/data/white.svg'
import { ReactComponent as DataIcon } from 'src/styling/icons/button/data/zodiac.svg'
import { ReactComponent as ReplaceReversedIcon } from 'src/styling/icons/button/replace/white.svg'
import { ReactComponent as SaveReversedIcon } from 'src/styling/icons/circle buttons/save/white.svg'
import { comet } from 'src/styling/variables'

import styles from './EditableCard.styles.js'

const useStyles = makeStyles(styles)

const fieldStyles = {
  field: {
    position: 'relative',
    width: 280,
    height: 48,
    padding: [[0, 4, 4, 0]],
    marginTop: 2
  },
  label: {
    color: comet,
    margin: [[0, 0, 0, 0]]
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
    '& > div': {
      '& > input': {
        padding: 0,
        fontSize: 14
      }
    }
  },
  readOnlyLabel: {
    color: comet,
    margin: [[3, 0, 3, 0]]
  },
  readOnlyValue: {
    margin: 0
  }
}

const fieldUseStyles = makeStyles(fieldStyles)

const EditableField = ({ editing, field, value, size, ...props }) => {
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
          <P>{value}</P>
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
            type={field.type}
            width={size}
            {...props}
          />
        </>
      )}
    </div>
  )
}

const ReadOnlyField = ({ field, value, ...props }) => {
  const classes = fieldUseStyles()
  const classNames = {
    [classes.field]: true,
    [classes.notEditing]: true
  }

  return (
    <>
      <div className={classnames(classNames)}>
        <Label1 className={classes.readOnlyLabel}>{field.label}</Label1>
        <P className={classes.readOnlyValue}>{value}</P>
      </div>
    </>
  )
}

const EditableCard = ({
  fields,
  save,
  authorize,
  hasImage,
  reject,
  state,
  title,
  titleIcon,
  children,
  validationSchema,
  initialValues,
  deleteEditedData,
  retrieveAdditionalData,
  hasAdditionalData = true,
  editable
}) => {
  const classes = useStyles()

  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(null)
  const [error, setError] = useState(null)

  const triggerInput = () => input.click()

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

  return (
    <div>
      <Card className={classes.card}>
        <CardContent>
          <div className={classes.headerWrapper}>
            <div className={classes.cardHeader}>
              {titleIcon}
              <H3 className={classes.cardTitle}>{title}</H3>
              {
                // TODO: Enable for next release
                /* <HoverableTooltip width={304}></HoverableTooltip> */
              }
            </div>
            {state && authorize && (
              <div className={classnames(label1ClassNames)}>
                <MainStatus statuses={[authorized]} />
              </div>
            )}
          </div>
          {children}
          <Formik
            validateOnBlur={false}
            validateOnChange={false}
            enableReinitialize
            validationSchema={validationSchema}
            initialValues={initialValues}
            onSubmit={values => {
              save(values)
              setEditing(false)
            }}
            onReset={() => {
              setEditing(false)
              setError(false)
            }}>
            {({ setFieldValue }) => (
              <Form>
                <PromptWhenDirty />
                <div className={classes.row}>
                  <Grid container>
                    <Grid container direction="column" item xs={6}>
                      {!hasImage &&
                        fields?.map((field, idx) => {
                          return idx >= 0 && idx < 4 ? (
                            !field.editable ? (
                              <ReadOnlyField
                                field={field}
                                value={initialValues[field.name]}
                              />
                            ) : (
                              <EditableField
                                field={field}
                                value={initialValues[field.name]}
                                editing={editing}
                                size={180}
                              />
                            )
                          ) : null
                        })}
                    </Grid>
                    <Grid container direction="column" item xs={6}>
                      {!hasImage &&
                        fields?.map((field, idx) => {
                          return idx >= 4 ? (
                            !field.editable ? (
                              <ReadOnlyField
                                field={field}
                                value={initialValues[field.name]}
                              />
                            ) : (
                              <EditableField
                                field={field}
                                value={initialValues[field.name]}
                                editing={editing}
                                size={180}
                              />
                            )
                          ) : null
                        })}
                    </Grid>
                  </Grid>
                </div>
                <div className={classes.edit}>
                  {!editing && (
                    <div className={classes.editButton}>
                      <div className={classes.deleteButton}>
                        {false && (
                          <ActionButton
                            color="primary"
                            type="button"
                            Icon={DeleteIcon}
                            InverseIcon={DeleteReversedIcon}
                            onClick={() => deleteEditedData()}>
                            Delete
                          </ActionButton>
                        )}
                        {!hasAdditionalData && (
                          <ActionButton
                            color="primary"
                            type="button"
                            Icon={DataIcon}
                            InverseIcon={DataReversedIcon}
                            onClick={() => retrieveAdditionalData()}>
                            Retrieve API data
                          </ActionButton>
                        )}
                      </div>
                      {editable && (
                        <ActionButton
                          color="primary"
                          Icon={EditIcon}
                          InverseIcon={EditReversedIcon}
                          onClick={() => setEditing(true)}>
                          Edit
                        </ActionButton>
                      )}
                      {!editable &&
                        authorize &&
                        authorized.label !== 'Accepted' && (
                          <div className={classes.button}>
                            <ActionButton
                              color="spring"
                              type="button"
                              Icon={AuthorizeIcon}
                              InverseIcon={AuthorizeIcon}
                              onClick={() => authorize()}>
                              Authorize
                            </ActionButton>
                          </div>
                        )}
                      {!editable &&
                        authorize &&
                        authorized.label !== 'Rejected' && (
                          <ActionButton
                            color="tomato"
                            type="button"
                            Icon={BlockIcon}
                            InverseIcon={BlockIcon}
                            onClick={() => reject()}>
                            Reject
                          </ActionButton>
                        )}
                    </div>
                  )}
                  {editing && (
                    <div className={classes.editingWrapper}>
                      <div className={classes.replace}>
                        {hasImage && (
                          <ActionButton
                            color="secondary"
                            type="button"
                            Icon={ReplaceReversedIcon}
                            InverseIcon={ReplaceReversedIcon}
                            onClick={() => triggerInput()}>
                            {
                              <div>
                                <input
                                  type="file"
                                  alt=""
                                  accept="image/*"
                                  className={classes.input}
                                  ref={fileInput => setInput(fileInput)}
                                  onChange={event => {
                                    // need to store it locally if we want to display it even after saving to db
                                    const file = R.head(event.target.files)
                                    if (!file) return
                                    setFieldValue(R.head(fields).name, file)
                                  }}
                                />
                                Replace
                              </div>
                            }
                          </ActionButton>
                        )}
                      </div>
                      <div className={classes.editingButtons}>
                        {fields && (
                          <div className={classes.button}>
                            <ActionButton
                              color="secondary"
                              Icon={SaveReversedIcon}
                              InverseIcon={SaveReversedIcon}
                              type="submit">
                              Save
                            </ActionButton>
                          </div>
                        )}
                        <div className={classes.button}>
                          <ActionButton
                            color="secondary"
                            Icon={CancelReversedIcon}
                            InverseIcon={CancelReversedIcon}
                            type="reset">
                            Cancel
                          </ActionButton>
                        </div>
                        {authorize && authorized.label !== 'Accepted' && (
                          <div className={classes.button}>
                            <ActionButton
                              color="spring"
                              type="button"
                              Icon={AuthorizeIcon}
                              InverseIcon={AuthorizeIcon}
                              onClick={() => authorize()}>
                              Authorize
                            </ActionButton>
                          </div>
                        )}
                        {authorize && authorized.label !== 'Rejected' && (
                          <ActionButton
                            color="tomato"
                            type="button"
                            Icon={BlockIcon}
                            InverseIcon={BlockIcon}
                            onClick={() => reject()}>
                            Reject
                          </ActionButton>
                        )}
                        {error && (
                          <ErrorMessage>Failed to save changes</ErrorMessage>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditableCard
