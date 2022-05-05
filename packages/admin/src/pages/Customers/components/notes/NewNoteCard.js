import { makeStyles, Paper } from '@material-ui/core'
import classNames from 'classnames'
import { React } from 'react'

import { P } from 'src/components/typography'
import { ReactComponent as AddIcon } from 'src/styling/icons/button/add/zodiac.svg'

import styles from './NoteCard.styles'

const useStyles = makeStyles(styles)

const NewNoteCard = ({ setOpenModal }) => {
  const classes = useStyles()
  return (
    <div className={classes.noteCardWrapper} onClick={() => setOpenModal(true)}>
      <Paper className={classNames(classes.noteCardChip, classes.newNoteCard)}>
        <AddIcon width={20} height={20} />
        <P>Add new</P>
      </Paper>
    </div>
  )
}

export default NewNoteCard
