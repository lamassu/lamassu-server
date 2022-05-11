import { makeStyles, Paper } from '@material-ui/core'
import * as R from 'ramda'
import { React } from 'react'

import { H3, P } from 'src/components/typography'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { formatDate } from 'src/utils/timezones'

import styles from './NoteCard.styles'

const useStyles = makeStyles(styles)

const formatContent = content => {
  const fragments = R.split(/\n/)(content)
  return R.map((it, idx) => {
    if (idx === fragments.length) return <>{it}</>
    return (
      <>
        {it}
        <br />
      </>
    )
  }, fragments)
}

const NoteCard = ({ note, deleteNote, handleClick, timezone }) => {
  const classes = useStyles()

  return (
    <div className={classes.noteCardWrapper}>
      <Paper className={classes.noteCardChip} onClick={() => handleClick(note)}>
        <div className={classes.noteCardHeader}>
          <div className={classes.noteCardTitle}>
            <H3 noMargin>{note?.title}</H3>
            <P noMargin>{formatDate(note?.created, timezone, 'yyyy-MM-dd')}</P>
          </div>
          <div>
            <DeleteIcon
              className={classes.deleteIcon}
              onClick={e => {
                e.stopPropagation()
                deleteNote({ noteId: note.id })
              }}
            />
          </div>
        </div>
        <P noMargin className={classes.noteCardContent}>
          {formatContent(note?.content)}
        </P>
      </Paper>
    </div>
  )
}

export default NoteCard
