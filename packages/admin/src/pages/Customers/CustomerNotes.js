import { makeStyles } from '@material-ui/core'
import * as R from 'ramda'
import { React, useState } from 'react'

import { H3 } from 'src/components/typography'

import styles from './CustomerNotes.styles'
import NewNoteCard from './components/notes/NewNoteCard'
import NewNoteModal from './components/notes/NewNoteModal'
import NoteCard from './components/notes/NoteCard'
import NoteEdit from './components/notes/NoteEdit'

const useStyles = makeStyles(styles)

const CustomerNotes = ({
  customer,
  createNote,
  deleteNote,
  editNote,
  timezone
}) => {
  const classes = useStyles()
  const [openModal, setOpenModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const customerNotes = R.sort(
    (a, b) => new Date(b?.created).getTime() - new Date(a?.created).getTime(),
    customer.notes ?? []
  )

  const handleModalClose = () => {
    setOpenModal(false)
  }

  const handleModalSubmit = it => {
    createNote(it)
    return handleModalClose()
  }

  const cancelNoteEditing = () => {
    setEditing(null)
  }

  const submitNoteEditing = it => {
    if (!R.equals(it.newContent, it.oldContent)) {
      editNote({
        noteId: it.noteId,
        newContent: it.newContent
      })
    }
    setEditing(null)
  }

  return (
    <div>
      <div className={classes.header}>
        <H3 className={classes.title}>{'Notes'}</H3>
      </div>
      {R.isNil(editing) && (
        <div className={classes.notesChipList}>
          <NewNoteCard setOpenModal={setOpenModal} />
          {R.map(
            it => (
              <NoteCard
                note={it}
                deleteNote={deleteNote}
                handleClick={setEditing}
                timezone={timezone}
              />
            ),
            customerNotes
          )}
        </div>
      )}
      {!R.isNil(editing) && (
        <NoteEdit
          note={editing}
          cancel={cancelNoteEditing}
          edit={submitNoteEditing}
          timezone={timezone}
        />
      )}
      {openModal && (
        <NewNoteModal
          showModal={openModal}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  )
}

export default CustomerNotes
