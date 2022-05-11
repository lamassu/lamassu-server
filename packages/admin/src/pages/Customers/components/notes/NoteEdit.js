import { makeStyles, Paper } from '@material-ui/core'
import { formatDurationWithOptions, intervalToDuration } from 'date-fns/fp'
import { Form, Formik, Field } from 'formik'
import { React, useRef } from 'react'
import * as Yup from 'yup'

import { ActionButton } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/formik'
import { P } from 'src/components/typography'
import { ReactComponent as CancelIconInverse } from 'src/styling/icons/button/cancel/white.svg'
import { ReactComponent as CancelIcon } from 'src/styling/icons/button/cancel/zodiac.svg'
import { ReactComponent as SaveIconInverse } from 'src/styling/icons/circle buttons/save/white.svg'
import { ReactComponent as SaveIcon } from 'src/styling/icons/circle buttons/save/zodiac.svg'
import { toTimezone } from 'src/utils/timezones'

import styles from './NoteCard.styles'

const useStyles = makeStyles(styles)

const NoteEdit = ({ note, cancel, edit, timezone }) => {
  const formRef = useRef()
  const classes = useStyles()

  const validationSchema = Yup.object().shape({
    content: Yup.string()
  })

  const initialValues = {
    content: note.content
  }

  return (
    <Paper className={classes.editCardChip}>
      <div className={classes.editCardHeader}>
        <P noMargin>
          {`Last edited `}
          {formatDurationWithOptions(
            { delimited: ', ' },
            intervalToDuration({
              start: toTimezone(new Date(note.lastEditedAt), timezone),
              end: toTimezone(new Date(), timezone)
            })
          )}
          {` ago`}
        </P>
        <div className={classes.editCardActions}>
          <ActionButton
            color="primary"
            type="button"
            Icon={CancelIcon}
            InverseIcon={CancelIconInverse}
            onClick={cancel}>
            {`Cancel`}
          </ActionButton>
          <ActionButton
            color="primary"
            type="submit"
            form="edit-note"
            Icon={SaveIcon}
            InverseIcon={SaveIconInverse}>
            {`Save changes`}
          </ActionButton>
          <ActionButton
            color="primary"
            type="button"
            Icon={CancelIcon}
            InverseIcon={CancelIconInverse}
            onClick={() => formRef.current.setFieldValue('content', '')}>
            {`Clear content`}
          </ActionButton>
        </div>
      </div>
      <Formik
        validateOnChange={false}
        validateOnBlur={false}
        validationSchema={validationSchema}
        initialValues={initialValues}
        onSubmit={({ content }) =>
          edit({
            noteId: note.id,
            newContent: content,
            oldContent: note.content
          })
        }
        innerRef={formRef}>
        <Form id="edit-note">
          <Field
            name="content"
            component={TextInput}
            className={classes.editNotesContent}
            size="sm"
            autoComplete="off"
            fullWidth
            multiline={true}
            rows={15}
          />
        </Form>
      </Formik>
    </Paper>
  )
}

export default NoteEdit
